package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// RegisterUser trata o registo de um novo usuário
func RegisterUser(c *gin.Context) {
	var input struct {
		Name     string `json:"name" binding:"required"`
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos. Todos os campos são obrigatórios."})
		return
	}

	// Criptografa a senha
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao processar a senha."})
		return
	}

	user := User{Name: input.Name, Email: input.Email, Password: string(hashedPassword)}

	// Salva o usuário no banco de dados
	result := db.Create(&user)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Não foi possível registar o usuário. O e-mail já pode estar em uso."})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Usuário registado com sucesso!"})
}

// LoginUser trata o login de um usuário (lógica a ser implementada)
func LoginUser(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Login em breve!"})
}

// GetParishInfo retorna as informações estáticas da paróquia
func GetParishInfo(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"name":    "Paróquia Santo Antônio de Marília",
		"history": "Aqui vai um resumo da rica história da nossa paróquia, desde sua fundação até os dias de hoje, destacando os momentos mais importantes, os párocos que por aqui passaram e o crescimento da nossa comunidade de fé e amor.",
	})
}

// GetServices busca todos os serviços no banco de dados
func GetServices(c *gin.Context) {
	var services []Service
	if err := db.Find(&services).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar serviços"})
		return
	}
	c.JSON(http.StatusOK, services)
}

// GetPastorals busca todas as pastorais no banco de dados
func GetPastorals(c *gin.Context) {
	var pastorals []Pastoral
	if err := db.Find(&pastorals).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar pastorais"})
		return
	}
	c.JSON(http.StatusOK, pastorals)
}

// CreateRegistration cria uma nova inscrição para um serviço
func CreateRegistration(c *gin.Context) {
	var reg Registration
	if err := c.ShouldBindJSON(&reg); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := db.Create(&reg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar inscrição"})
		return
	}
	c.JSON(http.StatusOK, reg)
}

