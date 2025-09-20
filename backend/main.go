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
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// --- Variáveis Globais ---
var db *gorm.DB
var jwtKey []byte
var AdminEmail string

// --- Estruturas (Models) ---
type User struct {
	gorm.Model
	Name     string `json:"name"`
	Email    string `json:"email" gorm:"unique"`
	Password string `json:"-" gorm:"size:255"`
	Address  string `json:"address"`
	DOB      string `json:"dob"`
	Gender   string `json:"gender"`
	IsAdmin  bool   `json:"isAdmin" gorm:"default:false"`
}

type Service struct {
	gorm.Model
	Name        string `json:"name"`
	Description string `json:"description"`
}

type Pastoral struct {
	gorm.Model
	Name        string `json:"name"`
	Description string `json:"description"`
	MeetingInfo string `json:"meeting_info"`
}

type MassTime struct {
	gorm.Model
	Day         string `json:"day"`
	Time        string `json:"time"`
	Location    string `json:"location"`
	Description string `json:"description"`
}

type Registration struct {
	gorm.Model
	UserID    uint    `json:"user_id"`
	ServiceID uint    `json:"service_id"`
	Status    string  `json:"status"`
	Service   Service `json:"service" gorm:"foreignKey:ServiceID"`
	User      User    `json:"user" gorm:"foreignKey:UserID"`
}

type Contribution struct {
	gorm.Model
	UserID uint    `json:"user_id"`
	User   User    `json:"user"`
	Value  float64 `json:"value"`
	Method string  `json:"method"`
	Status string  `json:"status"`
}

// --- Estruturas para Autenticação e Input ---
type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type RegisterInput struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Address  string `json:"address"`
	DOB      string `json:"dob"`
	Gender   string `json:"gender"`
}

type Claims struct {
	UserID  uint `json:"user_id"`
	IsAdmin bool `json:"isAdmin"`
	jwt.RegisteredClaims
}

// --- Função Principal ---
func main() {
	// Carrega variáveis de ambiente do ficheiro .env (para desenvolvimento local)
	godotenv.Load()

	// Carrega as configurações das variáveis de ambiente
	jwtKey = []byte(os.Getenv("JWT_SECRET_KEY"))
	AdminEmail = os.Getenv("ADMIN_EMAIL")

	ConnectDatabase()
	db.AutoMigrate(&User{}, &Service{}, &Pastoral{}, &MassTime{}, &Registration{}, &Contribution{})
	// Popula a base de dados com dados iniciais se estiver vazia
	seedDatabase()

	router := gin.Default()

	config := cors.DefaultConfig()
	allowedOrigin := os.Getenv("CORS_ALLOWED_ORIGIN")
	if allowedOrigin != "" {
		config.AllowOrigins = []string{allowedOrigin, "http://localhost:3000"}
	} else {
		config.AllowAllOrigins = true
	}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
	router.Use(cors.New(config))

	api := router.Group("/api")
	{
		// Rotas Públicas
		api.POST("/register", RegisterUser)
		api.POST("/login", LoginUser)
		api.GET("/parish-info", GetParishInfo)
		api.GET("/services", GetServices)
		api.GET("/pastorais", GetPastorais)
		api.GET("/mass-times", GetMassTimes)

		// Rotas Protegidas para Utilizadores Autenticados
		authenticated := api.Group("/")
		authenticated.Use(AuthMiddleware())
		{
			authenticated.POST("/registrations", CreateRegistration)
			authenticated.GET("/my-registrations", GetMyRegistrations)
			authenticated.POST("/contributions", CreateContribution)
			authenticated.GET("/my-contributions", GetMyContributions)
		}

		// Rotas de Administração
		admin := api.Group("/admin")
		admin.Use(AuthMiddleware(), AdminMiddleware())
		{
			admin.GET("/dashboard-stats", GetDashboardStats)
			admin.GET("/registrations", GetAllRegistrations)
			admin.PATCH("/registrations/:id", UpdateRegistrationStatus)
			admin.GET("/users", GetAllUsers)
			admin.PUT("/users/:id", UpdateUser)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "10000"
	}
	log.Printf("Servidor backend iniciado na porta %s", port)
	router.Run(":" + port)
}

// --- Handlers (Lógica das Rotas) ---

func RegisterUser(c *gin.Context) {
	var input RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao processar a senha"})
		return
	}

	user := User{
		Name:     input.Name,
		Email:    input.Email,
		Password: string(hashedPassword),
		Address:  input.Address,
		DOB:      input.DOB,
		Gender:   input.Gender,
		IsAdmin:  input.Email == AdminEmail,
	}

	if result := db.Create(&user); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Não foi possível registar o utilizador. O e-mail já pode existir."})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Utilizador registado com sucesso!"})
}

func LoginUser(c *gin.Context) {
	var input LoginInput
	var user User

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	if err := db.Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilizador não encontrado."})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Senha incorreta."})
		return
	}

	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID:  user.ID,
		IsAdmin: user.IsAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Não foi possível gerar o token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login bem-sucedido!",
		"token":   tokenString,
		"user": gin.H{
			"id":      user.ID,
			"name":    user.Name,
			"email":   user.Email,
			"isAdmin": user.IsAdmin,
		},
	})
}

func GetParishInfo(c *gin.Context) {
	info := gin.H{
		"name":              "Paróquia Santo Antônio de Marília",
		"history":           "A Paróquia Santo Antônio de Marília, confiada aos cuidados dos Padres Estigmatinos, tem uma rica história de fé e serviço à comunidade...",
		"secretariat_hours": "Segunda a sexta das 8h às 17h30\nSábado das 8h às 12h",
		"priest_hours":      "Segunda: 9h30 às 11h | 14h às 15h30\nQuarta, quinta e sexta: 9h às 11h30 | 14h às 15h30",
	}
	c.JSON(http.StatusOK, info)
}

func GetServices(c *gin.Context) {
	var services []Service
	if err := db.Find(&services).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar serviços"})
		return
	}
	c.JSON(http.StatusOK, services)
}

func GetPastorais(c *gin.Context) {
	var pastorals []Pastoral
	if err := db.Find(&pastorals).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar pastorais"})
		return
	}
	c.JSON(http.StatusOK, pastorals)
}

func GetMassTimes(c *gin.Context) {
	var massTimes []MassTime
	if err := db.Order("location, id").Find(&massTimes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar horários de missa"})
		return
	}
	c.JSON(http.StatusOK, massTimes)
}

func CreateRegistration(c *gin.Context) {
	var input struct {
		ServiceID uint `json:"service_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do serviço é obrigatório."})
		return
	}
	userID, _ := c.Get("userID")
	var existingReg Registration
	if err := db.Where("user_id = ? AND service_id = ?", userID, input.ServiceID).First(&existingReg).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Você já está inscrito neste serviço."})
		return
	}
	registration := Registration{
		UserID:    userID.(uint),
		ServiceID: input.ServiceID,
		Status:    "Pendente",
	}
	if result := db.Create(&registration); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Não foi possível processar a inscrição."})
		return
	}
	var service Service
	db.First(&service, input.ServiceID)
	c.JSON(http.StatusOK, gin.H{"message": "Inscrição em '" + service.Name + "' realizada com sucesso!"})
}

func GetMyRegistrations(c *gin.Context) {
	userID, _ := c.Get("userID")
	var registrations []Registration
	if err := db.Preload("Service").Where("user_id = ?", userID).Find(&registrations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar inscrições."})
		return
	}
	c.JSON(http.StatusOK, registrations)
}

func CreateContribution(c *gin.Context) {
	var input struct {
		Value  float64 `json:"value" binding:"required"`
		Method string  `json:"method" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados de contribuição inválidos."})
		return
	}
	userID, _ := c.Get("userID")
	contribution := Contribution{
		UserID: userID.(uint),
		Value:  input.Value,
		Method: input.Method,
		Status: "Confirmado",
	}
	if result := db.Create(&contribution); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Não foi possível registar a contribuição."})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Contribuição registada com sucesso!"})
}

func GetMyContributions(c *gin.Context) {
	userID, _ := c.Get("userID")
	var contributions []Contribution
	if err := db.Where("user_id = ?", userID).Order("created_at desc").Find(&contributions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar contribuições."})
		return
	}
	c.JSON(http.StatusOK, contributions)
}

func GetAllRegistrations(c *gin.Context) {
	var registrations []Registration
	if err := db.Preload("User").Preload("Service").Order("created_at desc").Find(&registrations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar todas as inscrições."})
		return
	}
	c.JSON(http.StatusOK, registrations)
}

func UpdateRegistrationStatus(c *gin.Context) {
	var input struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Novo status é obrigatório."})
		return
	}
	regID := c.Param("id")
	var registration Registration
	if err := db.First(&registration, regID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Inscrição não encontrada."})
		return
	}
	registration.Status = input.Status
	if err := db.Save(&registration).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao atualizar o status."})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Status da inscrição atualizado com sucesso!"})
}

func GetDashboardStats(c *gin.Context) {
	var totalUsers int64
	var totalRegistrations int64
	var totalContributions int64
	var totalContributionValue float64

	db.Model(&User{}).Count(&totalUsers)
	db.Model(&Registration{}).Count(&totalRegistrations)
	db.Model(&Contribution{}).Count(&totalContributions)
	db.Model(&Contribution{}).Select("sum(value)").Row().Scan(&totalContributionValue)

	stats := gin.H{
		"total_users":              totalUsers,
		"total_registrations":      totalRegistrations,
		"total_contributions":      totalContributions,
		"total_contribution_value": totalContributionValue,
	}

	c.JSON(http.StatusOK, stats)
}

func GetAllUsers(c *gin.Context) {
	var users []User
	if err := db.Order("name asc").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar utilizadores."})
		return
	}
	c.JSON(http.StatusOK, users)
}

func UpdateUser(c *gin.Context) {
	userID := c.Param("id")
	var user User
	if err := db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Utilizador não encontrado."})
		return
	}

	var input struct {
		Name    string `json:"name"`
		Email   string `json:"email"`
		Address string `json:"address"`
		DOB     string `json:"dob"`
		Gender  string `json:"gender"`
		IsAdmin bool   `json:"isAdmin"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados de entrada inválidos."})
		return
	}

	user.Name = input.Name
	user.Email = input.Email
	user.Address = input.Address
	user.DOB = input.DOB
	user.Gender = input.Gender
	user.IsAdmin = input.IsAdmin

	if err := db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao atualizar o utilizador."})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Utilizador atualizado com sucesso!"})
}

// --- Funções de Suporte (Middlewares e Conexão com DB) ---

func ConnectDatabase() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL não definida")
	}

	var err error
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

