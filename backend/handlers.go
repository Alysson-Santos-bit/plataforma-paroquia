package main

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// --- Estrutura para entrada de dados de registo ---
type RegisterInput struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// RegisterUser lida com o registo de um novo utilizador.
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
	}

	result := db.Create(&user)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Não foi possível registar o utilizador. O e-mail já pode existir."})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Utilizador registado com sucesso!"})
}

// LoginUser lida com a autenticação do utilizador.
func LoginUser(c *gin.Context) {
	var input LoginInput
	var user User

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	if err := db.Where("email = ?", input.Email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilizador não encontrado."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro no servidor."})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Senha incorreta."})
		return
	}

	expirationTime := time.Now().Add(24 * time.Hour)
	// Correção: Inicializa a estrutura JWT embutida corretamente.
	claims := &Claims{
		UserID: user.ID,
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
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
		},
	})
}

// --- Handlers para os dados da paróquia ---

func GetParishInfo(c *gin.Context) {
	info := gin.H{
		"name":    "Paróquia Santo Antônio de Marília",
		"history": "A Paróquia Santo Antônio de Marília, confiada aos cuidados dos Frades Franciscanos Capuchinhos, tem uma rica história de fé e serviço à comunidade. Desde a sua fundação, tem sido um farol de esperança, oferecendo orientação espiritual, celebrando os sacramentos e promovendo a caridade. Com uma forte devoção a Santo Antônio, conhecido como o 'santo do povo', a paróquia é um ponto de encontro para os fiéis, um lugar de oração, e um centro de atividades pastorais que buscam viver o Evangelho no dia a dia.",
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

// CreateRegistration lida com a inscrição de um utilizador num serviço.
func CreateRegistration(c *gin.Context) {
	var input struct {
		ServiceID uint `json:"service_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do serviço é obrigatório."})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilizador não autenticado."})
		return
	}

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

	log.Printf("Utilizador ID %d inscreveu-se no serviço ID %d (%s)", userID, input.ServiceID, service.Name)
	c.JSON(http.StatusOK, gin.H{"message": "Inscrição em '" + service.Name + "' realizada com sucesso!"})
}

    

