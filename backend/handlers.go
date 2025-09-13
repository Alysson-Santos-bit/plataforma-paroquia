package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// Estrutura para receber os dados de registro do usuário
type RegisterInput struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// Estrutura para receber os dados de login
type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// RegisterUser lida com o cadastro de novos usuários
func RegisterUser(c *gin.Context) {
	var input RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Gera o hash da senha
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao processar senha"})
		return
	}

	user := User{Name: input.Name, Email: input.Email, PasswordHash: string(hashedPassword)}

	// Salva o usuário no banco
	result := DB.Create(&user)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Email já cadastrado"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Usuário registrado com sucesso!"})
}

// LoginUser lida com a autenticação de usuários
func LoginUser(c *gin.Context) {
	var input LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user User
	// Procura o usuário pelo email
	if err := DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email ou senha inválidos"})
		return
	}

	// Compara a senha fornecida com o hash salvo
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email ou senha inválidos"})
		return
	}

	// Lógica de token (JWT) seria implementada aqui em um projeto real
	c.JSON(http.StatusOK, gin.H{"message": "Login bem-sucedido!", "userName": user.Name})
}

// GetParishInfo retorna informações estáticas da paróquia
func GetParishInfo(c *gin.Context) {
	info := gin.H{
		"history": "A Paróquia Santo Antônio de Marília foi fundada em 13 de Junho de 1950, por Dom Hugo Bressane de Araújo. Desde então, tem sido um farol de fé e comunidade na cidade, crescendo junto com seus paroquianos e servindo como um centro de vida espiritual e social para inúmeras famílias.",
		"mass_times": []string{
			"Segunda a Sexta: 19h30",
			"Sábado: 19h00",
			"Domingo: 07h00, 10h00 e 19h00",
		},
		"liturgical_calendar_url": "https://www.vaticannews.va/pt/calendario-liturgico.html", // Exemplo
	}
	c.JSON(http.StatusOK, info)
}

// GetServices retorna a lista de serviços disponíveis
func GetServices(c *gin.Context) {
	var services []Service
	DB.Find(&services)
	c.JSON(http.StatusOK, services)
}

// GetPastorals retorna a lista de pastorais
func GetPastorals(c *gin.Context) {
	var pastorals []Pastoral
	DB.Find(&pastorals)
	c.JSON(http.StatusOK, pastorals)
}

// Estrutura para receber dados de uma nova inscrição
type RegistrationInput struct {
	UserName    string `json:"userName"`
	UserEmail   string `json:"userEmail"`
	UserPhone   string `json:"userPhone"`
	ServiceID   uint   `json:"serviceId"`
	ServiceNome string `json:"serviceName"`
}

// CreateRegistration cria uma nova inscrição para um serviço
func CreateRegistration(c *gin.Context) {
	var input RegistrationInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	registration := Registration{
		UserName:    input.UserName,
		UserEmail:   input.UserEmail,
		UserPhone:   input.UserPhone,
		ServiceID:   input.ServiceID,
		ServiceName: input.ServiceNome,
		Status:      "Recebida",
		SubmittedAt: time.Now(),
	}

	result := DB.Create(&registration)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Não foi possível processar a inscrição."})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Inscrição realizada com sucesso!"})
}
