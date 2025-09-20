package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// --- Variáveis Globais ---
var db *gorm.DB
var jwtKey = []byte(os.Getenv("JWT_SECRET_KEY")) // Carrega a chave secreta da variável de ambiente
var AdminEmail = os.Getenv("ADMIN_EMAIL")       // Carrega o e-mail do admin da variável de ambiente

// --- Estruturas (Models) ---
// Modelos da Base de Dados atualizados conforme a sua especificação.

// User representa um paroquiano registado na plataforma.
type User struct {
	gorm.Model
	Name     string `json:"name"`
	Email    string `json:"email" gorm:"unique"`
	Password string `json:"-" gorm:"size:255"`
	Address  string `json:"address"`
	DOB      string `json:"dob"` // Data de Nascimento
	Gender   string `json:"gender"`
	IsAdmin  bool   `json:"isAdmin" gorm:"default:false"`
}

// Service representa um serviço ou sacramento oferecido pela paróquia.
type Service struct {
	gorm.Model
	Name        string `json:"name"`
	Description string `json:"description"`
}

// Pastoral representa uma pastoral ou movimento da paróquia.
type Pastoral struct {
	gorm.Model
	Name        string `json:"name"`
	Description string `json:"description"`
	MeetingInfo string `json:"meeting_info"`
}

// MassTime representa um horário de missa
type MassTime struct {
	gorm.Model
	Day         string `json:"day"`
	Time        string `json:"time"`
	Location    string `json:"location"`
	Description string `json:"description"`
}

// Registration representa a inscrição de um utilizador num serviço.
type Registration struct {
	gorm.Model
	UserID    uint    `json:"user_id"`
	ServiceID uint    `json:"service_id"`
	Status    string  `json:"status"`
	Service   Service `json:"service" gorm:"foreignKey:ServiceID"`
	User      User    `json:"user" gorm:"foreignKey:UserID"`
}

// Contribution representa uma contribuição do dízimo.
type Contribution struct {
	gorm.Model
	UserID uint    `json:"user_id"`
	User   User    `json:"user"`
	Value  float64 `json:"value"`
	Method string  `json:"method"`
	Status string  `json:"status"`
}

// --- Estruturas para Autenticação ---

// LoginInput define a estrutura para os dados de entrada do login.
type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type Claims struct {
	UserID  uint `json:"user_id"`
	IsAdmin bool `json:"isAdmin"`
	jwt.RegisteredClaims
}

// --- Função Principal ---
func main() {
	// Conecta-se à base de dados
	ConnectDatabase()
	// Migra as tabelas da base de dados, adicionando as novas colunas se necessário
	db.AutoMigrate(&User{}, &Service{}, &Pastoral{}, &MassTime{}, &Registration{}, &Contribution{})

	router := gin.Default()

	// --- CONFIGURAÇÃO DO CORS ---
	config := cors.DefaultConfig()
	// Em produção, é mais seguro especificar o domínio do seu frontend.
	config.AllowOrigins = []string{os.Getenv("CORS_ALLOWED_ORIGIN"), "http://localhost:3000"}
	if os.Getenv("CORS_ALLOWED_ORIGIN") == "" {
		config.AllowAllOrigins = true
	}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}

	// Aplica o middleware de CORS a todas as rotas
	router.Use(cors.New(config))

	// Agrupa as rotas da API sob o prefixo /api
	api := router.Group("/api")
	{
		// Rotas Públicas (não precisam de login)
		api.POST("/register", RegisterUser)
		api.POST("/login", LoginUser)
		api.GET("/parish-info", GetParishInfo)
		api.GET("/services", GetServices)
		api.GET("/pastorais", GetPastorais)
		api.GET("/mass-times", GetMassTimes)

		// Rotas Autenticadas (precisam de login de utilizador normal)
		authenticated := api.Group("/")
		authenticated.Use(AuthMiddleware()) // Aplica o middleware de autenticação
		{
			authenticated.POST("/registrations", CreateRegistration)
			authenticated.GET("/my-registrations", GetMyRegistrations)
			authenticated.POST("/contributions", CreateContribution)
			authenticated.GET("/my-contributions", GetMyContributions)
		}

		// Rotas de Administração (precisam de login de admin)
		admin := api.Group("/admin")
		admin.Use(AuthMiddleware(), AdminMiddleware()) // Aplica ambos os middlewares
		{
			admin.GET("/dashboard-stats", GetDashboardStats)
			admin.GET("/registrations", GetAllRegistrations)
			// A rota para atualizar o status deve ser PATCH ou PUT
			admin.PATCH("/registrations/:id", UpdateRegistrationStatus)
			admin.GET("/users", GetAllUsers)
			admin.PUT("/users/:id", UpdateUser)
		}
	}

	// Inicia o servidor na porta 10000, conforme detectado nos logs da Render
	port := os.Getenv("PORT")
	if port == "" {
		port = "10000"
	}
	log.Printf("Servidor backend iniciado na porta %s", port)
	router.Run(":" + port)
}

// --- Funções de Suporte ---

// ConnectDatabase inicializa a conexão com a base de dados PostgreSQL
func ConnectDatabase() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL não definida")
	}

	var err error
	// Adiciona lógica de retentativa para a conexão com o banco de dados
	for i := 0; i < 5; i++ {
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err == nil {
			log.Println("Conexão com a base de dados estabelecida com sucesso.")
			return
		}
		log.Printf("Tentativa %d: Falha ao conectar. Tentando novamente em 5s...", i+1)
		time.Sleep(5 * time.Second)
	}

	log.Fatalf("Não foi possível conectar ao banco de dados após várias tentativas: %v", err)
}

// AuthMiddleware verifica o token JWT
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token de autorização não fornecido"})
			c.Abort()
			return
		}
		// O token geralmente vem no formato "Bearer <token>", então removemos o prefixo.
		if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
			tokenString = tokenString[7:]
		}

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token inválido"})
			c.Abort()
			return
		}

		// Adiciona o ID do utilizador e o status de admin ao contexto para uso posterior nos handlers
		c.Set("userID", claims.UserID)
		c.Set("isAdmin", claims.IsAdmin)

		c.Next()
	}
}

// AdminMiddleware verifica se o utilizador é um administrador
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		isAdmin, exists := c.Get("isAdmin")
		if !exists || !isAdmin.(bool) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso negado. Requer privilégios de administrador."})
			c.Abort()
			return
		}
		c.Next()
	}
}






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

