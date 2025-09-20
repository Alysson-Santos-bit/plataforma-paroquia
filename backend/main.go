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
	Name        string `json:"name" gorm:"unique"`
	Description string `json:"description"`
}

type Pastoral struct {
	gorm.Model
	Name        string `json:"name" gorm:"unique"`
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
	godotenv.Load()
	jwtKey = []byte(os.Getenv("JWT_SECRET_KEY"))
	AdminEmail = os.Getenv("ADMIN_EMAIL")

	ConnectDatabase()
	db.AutoMigrate(&User{}, &Service{}, &Pastoral{}, &MassTime{}, &Registration{}, &Contribution{})
	seedDatabase()

	router := gin.Default()

	config := cors.Config{
		AllowOrigins:     []string{os.Getenv("CORS_ALLOWED_ORIGIN")},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	router.Use(cors.New(config))

	api := router.Group("/api")
	{
		api.GET("/health", HealthCheckHandler)
		api.POST("/register", RegisterUser)
		api.POST("/login", LoginUser)
		api.GET("/parish-info", GetParishInfo)
		api.GET("/services", GetServices)
		api.GET("/pastorais", GetPastorais)
		api.GET("/mass-times", GetMassTimes)

		authenticated := api.Group("/")
		authenticated.Use(AuthMiddleware())
		{
			authenticated.POST("/registrations", CreateRegistration)
			authenticated.GET("/my-registrations", GetMyRegistrations)
			authenticated.POST("/contributions", CreateContribution)
			authenticated.GET("/my-contributions", GetMyContributions)
		}

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

func HealthCheckHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "UP"})
}

// --- HANDLERS DE DADOS PÚBLICOS COM DIAGNÓSTICO ---
func GetServices(c *gin.Context) {
	log.Println("[DIAGNÓSTICO] Handler GetServices foi chamado.")
	var services []Service
	result := db.Find(&services)

	if result.Error != nil {
		log.Printf("[DIAGNÓSTICO] ERRO ao buscar serviços: %v", result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar serviços"})
		return
	}

	log.Printf("[DIAGNÓSTICO] Consulta de serviços encontrou %d registos.", result.RowsAffected)
	c.JSON(http.StatusOK, services)
}

func GetMassTimes(c *gin.Context) {
	log.Println("[DIAGNÓSTICO] Handler GetMassTimes foi chamado.")
	var massTimes []MassTime
	result := db.Order("location, id").Find(&massTimes)

	if result.Error != nil {
		log.Printf("[DIAGNÓSTICO] ERRO ao buscar horários de missa: %v", result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar horários de missa"})
		return
	}

	log.Printf("[DIAGNÓSTICO] Consulta de horários de missa encontrou %d registos.", result.RowsAffected)
	c.JSON(http.StatusOK, massTimes)
}
// --- FIM DOS HANDLERS DE DIAGNÓSTICO ---


func RegisterUser(c *gin.Context) {
	var input RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	user := User{
		Name: input.Name, Email: input.Email, Password: string(hashedPassword),
		Address: input.Address, DOB: input.DOB, Gender: input.Gender,
		IsAdmin: input.Email == AdminEmail,
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
		RegisteredClaims: jwt.RegisteredClaims{ExpiresAt: jwt.NewNumericDate(expirationTime)},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Não foi possível gerar o token"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "Login bem-sucedido!", "token": tokenString,
		"user":    gin.H{"id": user.ID, "name": user.Name, "email": user.Email, "isAdmin": user.IsAdmin},
	})
}

func GetParishInfo(c *gin.Context) {
	info := gin.H{
		"name": "Paróquia Santo Antônio de Marília", "history": "A Paróquia Santo Antônio de Marília...",
		"secretariat_hours": "Segunda a sexta das 8h às 17h30\nSábado das 8h às 12h",
		"priest_hours":      "Segunda: 9h30 às 11h | 14h às 15h30\nQuarta, quinta e sexta: 9h às 11h30 | 14h às 15h30",
	}
	c.JSON(http.StatusOK, info)
}

func GetPastorais(c *gin.Context) {
	var pastorals []Pastoral
	db.Find(&pastorals)
	c.JSON(http.StatusOK, pastorals)
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
	if db.Where("user_id = ? AND service_id = ?", userID, input.ServiceID).First(&existingReg).Error == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Você já está inscrito neste serviço."})
		return
	}
	registration := Registration{UserID: userID.(uint), ServiceID: input.ServiceID, Status: "Pendente"}
	db.Create(&registration)
	var service Service
	db.First(&service, input.ServiceID)
	c.JSON(http.StatusOK, gin.H{"message": "Inscrição em '" + service.Name + "' realizada com sucesso!"})
}

func GetMyRegistrations(c *gin.Context) {
	userID, _ := c.Get("userID")
	var registrations []Registration
	db.Preload("Service").Where("user_id = ?", userID).Find(&registrations)
	c.JSON(http.StatusOK, registrations)
}

func CreateContribution(c *gin.Context) {
	var input struct {
		Value  float64 `json:"value" binding:"required"`
		Method string  `json:"method" binding:"required"`
	}
	c.ShouldBindJSON(&input)
	userID, _ := c.Get("userID")
	contribution := Contribution{UserID: userID.(uint), Value: input.Value, Method: input.Method, Status: "Confirmado"}
	db.Create(&contribution)
	c.JSON(http.StatusOK, gin.H{"message": "Contribuição registada com sucesso!"})
}

func GetMyContributions(c *gin.Context) {
	userID, _ := c.Get("userID")
	var contributions []Contribution
	db.Where("user_id = ?", userID).Order("created_at desc").Find(&contributions)
	c.JSON(http.StatusOK, contributions)
}

func GetAllRegistrations(c *gin.Context) {
	var registrations []Registration
	db.Preload("User").Preload("Service").Order("created_at desc").Find(&registrations)
	c.JSON(http.StatusOK, registrations)
}

func UpdateRegistrationStatus(c *gin.Context) {
	var input struct {
		Status string `json:"status" binding:"required"`
	}
	c.ShouldBindJSON(&input)
	regID := c.Param("id")
	var registration Registration
	db.First(&registration, regID)
	registration.Status = input.Status
	db.Save(&registration)
	c.JSON(http.StatusOK, gin.H{"message": "Status da inscrição atualizado com sucesso!"})
}

func GetDashboardStats(c *gin.Context) {
	var totalUsers, totalRegistrations, totalContributions int64
	var totalContributionValue float64
	db.Model(&User{}).Count(&totalUsers)
	db.Model(&Registration{}).Count(&totalRegistrations)
	db.Model(&Contribution{}).Count(&totalContributions)
	db.Model(&Contribution{}).Select("sum(value)").Row().Scan(&totalContributionValue)
	c.JSON(http.StatusOK, gin.H{
		"total_users": totalUsers, "total_registrations": totalRegistrations,
		"total_contributions": totalContributions, "total_contribution_value": totalContributionValue,
	})
}

func GetAllUsers(c *gin.Context) {
	var users []User
	db.Order("name asc").Find(&users)
	c.JSON(http.StatusOK, users)
}

func UpdateUser(c *gin.Context) {
	userID := c.Param("id")
	var user User
	db.First(&user, userID)
	var input struct {
		Name string `json:"name"`; Email string `json:"email"`; Address string `json:"address"`
		DOB string `json:"dob"`; Gender string `json:"gender"`; IsAdmin bool `json:"isAdmin"`
	}
	c.ShouldBindJSON(&input)
	user.Name, user.Email, user.Address = input.Name, input.Email, input.Address
	user.DOB, user.Gender, user.IsAdmin = input.DOB, input.Gender, input.IsAdmin
	db.Save(&user)
	c.JSON(http.StatusOK, gin.H{"message": "Utilizador atualizado com sucesso!"})
}

// --- Funções de Suporte ---

func ConnectDatabase() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" { log.Fatal("DATABASE_URL não definida") }
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
	log.Fatalf("Não foi possível conectar ao banco de dados: %v", err)
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := strings.TrimPrefix(c.GetHeader("Authorization"), "Bearer ")
		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (interface{}, error) { return jwtKey, nil })
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
		isAdmin, _ := c.Get("isAdmin")
		if !isAdmin.(bool) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso negado. Recurso de administrador."})
			c.Abort()
			return
		}
		c.Next()
	}
}

// --- Função de Seeding Inteligente ---
func seedDatabase() {
	log.Println("A iniciar o 'seeding' inteligente da base de dados...")

	// Seed Services
	services := []Service{
		{Name: "Batismo - Curso de Pais e Padrinhos", Description: "Inscrição para o curso preparatório para o batismo de crianças."},
		{Name: "Catequese Infantil", Description: "Inscrições para a catequese para crianças e pré-adolescentes."},
		{Name: "Curso de Noivos", Description: "Curso preparatório obrigatório para casais que desejam se casar na igreja."},
	}
	for _, service := range services {
		db.FirstOrCreate(&service, Service{Name: service.Name})
	}
	log.Println("Seeding de serviços concluído.")

	// Seed Pastorals
	pastorals := []Pastoral{
		{Name: "Pastoral da Criança", Description: "Acompanhamento de crianças carentes e suas famílias.", MeetingInfo: "Sábados, às 14h, no Salão Paroquial."},
		{Name: "Pastoral do Dízimo", Description: "Conscientização sobre a importância da contribuição.", MeetingInfo: "Primeira terça-feira do mês, às 19h30."},
	}
	for _, pastoral := range pastorals {
		db.FirstOrCreate(&pastoral, Pastoral{Name: pastoral.Name})
	}
	log.Println("Seeding de pastorais concluído.")

	// Seed Mass Times
	massTimes := []MassTime{
		{Day: "Domingo", Time: "7h", Location: "Igreja Matriz"},
		{Day: "Domingo", Time: "10h30", Location: "Igreja Matriz"},
		{Day: "Domingo", Time: "19h30", Location: "Igreja Matriz"},
		{Day: "Domingo", Time: "9h", Location: "Capela São Carlos"},
	}
	for _, mt := range massTimes {
		db.FirstOrCreate(&mt, MassTime{Day: mt.Day, Time: mt.Time, Location: mt.Location})
	}
	log.Println("Seeding de horários de missa concluído.")
	log.Println("Seeding inteligente terminado.")
}

