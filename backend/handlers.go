package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// Chave secreta para assinar os tokens JWT.
// Num ambiente de produção, isto DEVE vir de uma variável de ambiente segura.
var jwtKey = []byte("chave_secreta_super_segura_mudar_em_producao")

// Claims define a estrutura dos dados que guardamos dentro do token JWT.
type Claims struct {
	UserID uint   `json:"user_id"`
	Name   string `json:"name"`
	jwt.RegisteredClaims
}

// RegisterUser lida com o registo de um novo utilizador.
func RegisterUser(c *gin.Context) {
	var newUser User
	if err := c.ShouldBindJSON(&newUser); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados de entrada inválidos"})
		return
	}

	// Criptografa a senha antes de guardar
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newUser.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao processar a senha"})
		return
	}
	newUser.Password = string(hashedPassword)

	// Guarda o novo utilizador na base de dados
	if result := db.Create(&newUser); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Não foi possível registar o utilizador"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Utilizador registado com sucesso!"})
}

// LoginUser lida com a autenticação de um utilizador.
func LoginUser(c *gin.Context) {
	var loginDetails struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&loginDetails); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados de entrada inválidos"})
		return
	}

	var user User
	// Encontra o utilizador pelo e-mail
	if result := db.Where("email = ?", loginDetails.Email).First(&user); result.Error != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "E-mail ou senha inválidos"})
		return
	}

	// Compara a senha enviada com a senha criptografada na base de dados
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(loginDetails.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "E-mail ou senha inválidos"})
		return
	}

	// Se as credenciais estiverem corretas, cria o token JWT
	expirationTime := time.Now().Add(24 * time.Hour) // Token válido por 24 horas
	claims := &Claims{
		UserID: user.ID,
		Name:   user.Name,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Não foi possível gerar o token de acesso"})
		return
	}

	// Envia o token e o nome do utilizador de volta para o frontend
	c.JSON(http.StatusOK, gin.H{
		"message": "Login bem-sucedido!",
		"token":   tokenString,
		"user": gin.H{
			"name":  user.Name,
			"email": user.Email,
		},
	})
}


// GetParishInfo retorna informações estáticas sobre a paróquia.
func GetParishInfo(c *gin.Context) {
	info := gin.H{
		"name":    "Paróquia Santo Antônio de Marília - SP",
		"history": "Aqui vai um resumo da história da Paróquia Santo Antônio, destacando momentos importantes, a construção da igreja e o crescimento da comunidade ao longo dos anos...",
		"address": "Av. Santo Antônio, 777 - Centro, Marília - SP",
		"social": gin.H{
			"instagram": "https://www.instagram.com/paroquiasantoantoniomarilia/",
			"facebook":  "https://www.facebook.com/paroquiasantoantoniomarilia/",
		},
	}
	c.JSON(http.StatusOK, info)
}

// GetServices retorna a lista de serviços oferecidos pela paróquia.
func GetServices(c *gin.Context) {
	var services []Service
	if result := db.Find(&services); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar serviços"})
		return
	}
	c.JSON(http.StatusOK, services)
}

// GetPastorals retorna a lista de pastorais.
func GetPastorals(c *gin.Context) {
	var pastorals []Pastoral
	if result := db.Find(&pastorals); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar pastorais"})
		return
	}
	c.JSON(http.StatusOK, pastorals)
}

// CreateRegistration lida com a inscrição de um utilizador num serviço.
func CreateRegistration(c *gin.Context) {
	var registration Registration
	if err := c.ShouldBindJSON(&registration); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados de inscrição inválidos"})
		return
	}

	// Aqui, num sistema real, iríamos verificar se o utilizador está autenticado (usando o token JWT)
	// Por agora, vamos assumir que o `UserID` é enviado corretamente.

	if result := db.Create(&registration); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Não foi possível completar a inscrição"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Inscrição realizada com sucesso!"})
}

