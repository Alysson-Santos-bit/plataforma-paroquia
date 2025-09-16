package main

import (
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var db *gorm.DB
var err error
var jwtKey = []byte("sua_chave_secreta_super_segura")

// Claims é a estrutura que será codificada no token JWT.
type Claims struct {
	UserID uint `json:"user_id"`
	jwt.RegisteredClaims
}

func main() {
	dsn := "host=db user=user password=password dbname=paroquia_db port=5432 sslmode=disable TimeZone=America/Sao_Paulo"
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Falha ao conectar ao banco de dados")
	}

	// Migra o schema, garantindo que todas as tabelas, incluindo a de horários, sejam criadas.
	db.AutoMigrate(&User{}, &Service{}, &Pastoral{}, &Registration{}, &LoginInput{}, &Contribution{}, &MassTime{})
	seedDatabase()

	router := gin.Default()

	// Configuração de CORS para permitir a comunicação com o frontend
	config := cors.Config{
		AllowOrigins:     []string{"*"}, // Em produção, mude para o seu domínio real
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	router.Use(cors.New(config))

	// Agrupamento de rotas da API
	api := router.Group("/api")
	{
		// Rotas Públicas
		api.POST("/register", RegisterUser)
		api.POST("/login", LoginUser)
		api.GET("/parish-info", GetParishInfo)
		api.GET("/services", GetServices)
		api.GET("/pastorais", GetPastorais)
		api.GET("/mass-times", GetMassTimes) // Nova rota para os horários

		// Rotas Protegidas que exigem autenticação
		protected := api.Group("/")
		protected.Use(AuthMiddleware())
		{
			protected.POST("/registrations", CreateRegistration)
			protected.GET("/my-registrations", GetMyRegistrations)
			protected.POST("/contributions", CreateContribution)
			protected.GET("/my-contributions", GetMyContributions)
		}
	}

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})


	log.Println("Servidor backend iniciado em http://localhost:8080")
	router.Run(":8080")
}

// AuthMiddleware verifica o token JWT para proteger as rotas.
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
		c.Next()
	}
}

// seedDatabase popula a base de dados com dados iniciais se estiver vazia.
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
			{Name: "Agendamento com o Padre", Description: "Marque um horário para confissão ou orientação espiritual."},
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
			// Matriz
			{Day: "Domingo", Time: "07h00", Location: "Matriz Santo Antônio", Description: "Missa"},
			{Day: "Domingo", Time: "10h30", Location: "Matriz Santo Antônio", Description: "Missa"},
			{Day: "Domingo", Time: "19h30", Location: "Matriz Santo Antônio", Description: "Missa"},
			{Day: "Segunda-feira", Time: "19h30", Location: "Matriz Santo Antônio", Description: "Novena N. Sra. Perpétuo Socorro"},
			{Day: "Quarta-feira", Time: "19h30", Location: "Matriz Santo Antônio", Description: "Novena N. Sra. Perpétuo Socorro"},
			{Day: "Quinta-feira", Time: "12h00", Location: "Matriz Santo Antônio", Description: "Exposição do Santíssimo"},
			{Day: "Quinta-feira", Time: "16h00", Location: "Matriz Santo Antônio", Description: "Missa"},
			{Day: "Sexta-feira", Time: "16h00", Location: "Matriz Santo Antônio", Description: "Missa"},
			{Day: "Sábado", Time: "16h00", Location: "Matriz Santo Antônio", Description: "Missa"},
			// Capelas e outros locais
			{Day: "Domingo", Time: "09h00", Location: "Capela São Carlos", Description: "Missa"},
			{Day: "Quarta-feira", Time: "19h30", Location: "Capela São Carlos", Description: "Missa"},
			{Day: "Domingo", Time: "09h00", Location: "Capela São Vicente", Description: "Missa"},
			{Day: "Quinta-feira", Time: "19h30", Location: "Capela N. Sra. Aparecida", Description: "Missa"},
			{Day: "Sábado", Time: "19h30", Location: "Capela N. Sra. Aparecida", Description: "Missa"},
			{Day: "Sábado", Time: "17h00", Location: "Capela N. Sra. de Lourdes", Description: "Missa"},
			{Day: "Segunda-feira", Time: "16h00", Location: "Cemitério da Saudade", Description: "Missa"},
			{Day: "4º Domingo do Mês", Time: "10h30", Location: "Círculo Católico Estrela da Manhã", Description: "Missa"},
		}
		db.Create(&massTimes)
	}
}

