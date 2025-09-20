	package main

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var db *gorm.DB
var err error
var jwtKey []byte
var AdminEmail string

type Claims struct {
	UserID  uint `json:"user_id"`
	IsAdmin bool `json:"isAdmin"`
	jwt.RegisteredClaims
}

func main() {
	godotenv.Load() 

	jwtKey = []byte(os.Getenv("JWT_KEY"))
	AdminEmail = os.Getenv("ADMIN_EMAIL")
	dsn := os.Getenv("DATABASE_URL")

	if dsn == "" {
		log.Fatal("Erro: DATABASE_URL não está definida.")
	}
	
	for i := 0; i < 5; i++ {
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err == nil {
			break
		}
		log.Printf("Tentativa %d: Falha ao conectar. Tentando novamente em 5s...", i+1)
		time.Sleep(5 * time.Second)
	}
	if err != nil {
		log.Fatal("Não foi possível conectar ao banco de dados:", err)
	}

	db.AutoMigrate(&User{}, &Service{}, &Pastoral{}, &Registration{}, &Contribution{}, &MassTime{}, &LoginInput{})
	seedDatabase()

	router := gin.Default()
	
	config := cors.DefaultConfig()
	allowedOrigin := os.Getenv("CORS_ALLOWED_ORIGIN")
	if allowedOrigin != "" {
		config.AllowOrigins = []string{allowedOrigin} 
	} else {
		config.AllowAllOrigins = true 
	}
	config.AllowHeaders = append(config.AllowHeaders, "Authorization")
	router.Use(cors.New(config))

	api := router.Group("/api")
	{
		api.POST("/register", RegisterUser)
		api.POST("/login", LoginUser)
		api.GET("/parish-info", GetParishInfo)
		api.GET("/services", GetServices)
		api.GET("/pastorais", GetPastorais)
		api.GET("/mass-times", GetMassTimes)
	}
	
	protected := api.Group("/")
	protected.Use(AuthMiddleware())
	{
		protected.POST("/registrations", CreateRegistration)
		protected.GET("/my-registrations", GetMyRegistrations)
		protected.POST("/contributions", CreateContribution)
		protected.GET("/my-contributions", GetMyContributions)
	}

	admin := api.Group("/admin")
	admin.Use(AuthMiddleware())
	admin.Use(AdminMiddleware())
	{
		admin.GET("/registrations", GetAllRegistrations)
		admin.PATCH("/registrations/:id", UpdateRegistrationStatus)
		admin.GET("/stats", GetDashboardStats)
		admin.GET("/users", GetAllUsers)
		admin.PUT("/users/:id", UpdateUser)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Servidor backend iniciado na porta %s", port)
	router.Run(":" + port)
}

// ... (Resto do ficheiro main.go que contém os middlewares e seedDatabase)



// Middlewares de Autenticação e Autorização
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Cabeçalho de autorização não encontrado"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token inválido ou expirado"})
			c.Abort()
			return
		}

		c.Set("userID", claims.UserID)
		c.Set("isAdmin", claims.IsAdmin)
		c.Next()
	}
}

func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		isAdmin, exists := c.Get("isAdmin")
		if !exists || !isAdmin.(bool) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso negado. Recurso de administrador."})
			c.Abort()
			return
		}
		c.Next()
	}
}

func seedDatabase() {
    var count int64
    db.Model(&Service{}).Count(&count)
    if count == 0 {
        services := []Service{
            {Name: "Batismo - Curso de Pais e Padrinhos", Description: "Inscrição para o curso preparatório para o batismo de crianças."},
            {Name: "Catequese Infantil", Description: "Inscrições para a catequese para crianças e pré-adolescentes."},
            {Name: "Catequese de Adultos", Description: "Preparação para os sacramentos da iniciação cristã para adultos."},
            {Name: "Curso de Noivos", Description: "Curso preparatório obrigatório para casais que desejam se casar na igreja."},
            {Name: "Encontro de Casais com Cristo (ECC)", Description: "Movimento da Igreja Católica para casais."},
            {Name: "Agendamento de Casamento", Description: "Reserve a data para a sua cerimônia de casamento na paróquia."},
						{Name: "Crisma", Description: "Sacramento da confirmação para jovens e adultos."},
						{Name: "Primeira Eucaristia", Description: "Preparação para receber o sacramento da Eucaristia pela primeira vez."},
        }
        db.Create(&services)
    }

	db.Model(&Pastoral{}).Count(&count)
	if count == 0 {
		pastorals := []Pastoral{
			{Name: "Pastoral da Criança", Description: "Acompanhamento de crianças carentes e suas famílias.", MeetingInfo: "Sábados, às 14h, no Salão Paroquial."},
			{Name: "Pastoral do Dízimo", Description: "Conscientização sobre a importância da contribuição para a comunidade.", MeetingInfo: "Primeira terça-feira do mês, às 19h30."},
			{Name: "Pastoral Familiar", Description: "Apoio e formação para as famílias da comunidade.", MeetingInfo: "Último domingo do mês, após a missa das 10h."},
			{Name: "Grupo de Jovens", Description: "Encontros de oração, formação e convivência para a juventude.", MeetingInfo: "Sextas-feiras, às 20h, na sala 5."},
		}
		db.Create(&pastorals)
	}

	db.Model(&MassTime{}).Count(&count)
	if count == 0 {
		massTimes := []MassTime{
			{Day: "Segunda e Quarta", Time: "19h30", Location: "Igreja Matriz", Description: "Novena N. Sra. Perpétuo Socorro"},
			{Day: "Quinta-feira", Time: "12h", Location: "Igreja Matriz", Description: "Exposição do Santíssimo"},
			{Day: "Quinta-feira", Time: "16h", Location: "Igreja Matriz", Description: ""},
			{Day: "Sexta-feira", Time: "16h", Location: "Igreja Matriz", Description: ""},
			{Day: "Sábado", Time: "16h", Location: "Igreja Matriz", Description: ""},
			{Day: "Domingo", Time: "7h", Location: "Igreja Matriz", Description: ""},
			{Day: "Domingo", Time: "10h30", Location: "Igreja Matriz", Description: ""},
			{Day: "Domingo", Time: "19h30", Location: "Igreja Matriz", Description: ""},
			{Day: "Quarta-feira", Time: "19h30", Location: "Capela São Carlos (Rua Piratininga, 1111)", Description: ""},
			{Day: "Domingo", Time: "9h", Location: "Capela São Carlos (Rua Piratininga, 1111)", Description: ""},
			{Day: "Domingo", Time: "9h", Location: "Capela São Vicente (Rua Catanduva, 489)", Description: ""},
			{Day: "Quinta-feira", Time: "19h30", Location: "Capela Nossa Senhora Aparecida (Rua dos Crisântemos, 68)", Description: ""},
			{Day: "Sábado", Time: "19h30", Location: "Capela Nossa Senhora Aparecida (Rua dos Crisântemos, 68)", Description: ""},
			{Day: "Sábado", Time: "17h", Location: "Capela Nossa Senhora de Lourdes (Rua 7 de setembro, 1128)", Description: ""},
			{Day: "Segunda-feira", Time: "16h", Location: "Cemitério da Saudade (Av. da Saudade, 700)", Description: ""},
			{Day: "4º Domingo do Mês", Time: "10h30", Location: "Círculo Católico Estrela da Manhã (R. Araraquara, 95)", Description: ""},
		}
		db.Create(&massTimes)
	}
}

