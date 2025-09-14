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

// Claims será a estrutura do nosso payload JWT.
type Claims struct {
	UserID uint   `json:"user_id"`
	Name   string `json:"name"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

func main() {
	dsn := "host=db user=user password=password dbname=paroquia_db port=5432 sslmode=disable TimeZone=America/Sao_Paulo"
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Falha ao conectar à base de dados: %v", err)
	}

	db.AutoMigrate(&User{}, &Service{}, &Pastoral{}, &Registration{})
	log.Println("Base de dados migrada com sucesso.")
	seedDatabase(db)

	router := gin.Default()

	// Configuração de CORS Específica
	config := cors.Config{
		AllowOrigins:     []string{"*"}, // Em produção, mude para o URL do seu frontend
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	router.Use(cors.New(config))

	api := router.Group("/api")
	{
		api.POST("/register", RegisterUser)
		api.POST("/login", LoginUser)
		api.GET("/parish-info", GetParishInfo)
		api.GET("/services", GetServices)
		api.GET("/pastorais", GetPastorais) // Rota corrigida para usar a grafia portuguesa
		protected := api.Group("/")
		protected.Use(AuthMiddleware())
		{
			protected.POST("/registrations", CreateRegistration)
		}
	}

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	log.Println("Servidor backend iniciado em http://localhost:8080")
	router.Run(":8080")
}

// AuthMiddleware cria o nosso "porteiro" de autenticação
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Cabeçalho de autorização não encontrado"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Formato de autorização inválido"})
			c.Abort()
			return
		}

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
func seedDatabase(db *gorm.DB) {
	var count int64
	db.Model(&Service{}).Count(&count)
	if count > 0 {
		return
	}

	services := []Service{
		{Name: "Batismo (Inscrição para Pais e Padrinhos)", Description: "Inscreva-se no curso de preparação para o sacramento do Batismo. Essencial para pais e padrinhos que desejam batizar as suas crianças na fé católica."},
		{Name: "Catequese Infantil e Primeira Comunhão", Description: "Inscrições abertas para a catequese, um caminho de fé e preparação para receber Jesus na Eucaristia pela primeira vez."},
		{Name: "Crisma (Catequese de Perseverança)", Description: "Jovens, confirmem a vossa fé! Inscrevam-se na catequese de preparação para o sacramento do Crisma e recebam os dons do Espírito Santo."},
		{Name: "Catequese de Adultos", Description: "Nunca é tarde para iniciar ou completar a sua jornada nos sacramentos. Inscrições para adultos que desejam receber o Batismo, a Primeira Comunhão ou o Crisma."},
		{Name: "Curso de Noivos", Description: "Um passo essencial na preparação para o Matrimónio. Inscrevam-se no nosso curso e fortaleçam os vossos laços no amor de Cristo."},
		{Name: "Agendamento de Casamento", Description: "Deseja celebrar o seu matrimónio na nossa paróquia? Inicie aqui o processo de agendamento e verificação de datas disponíveis."},
		{Name: "ECC (Encontro de Casais com Cristo)", Description: "Fortaleça a sua vida conjugal e familiar. Inscreva-se para participar no Encontro de Casais com Cristo e renove a sua união."},
		{Name: "Curso de Segunda União", Description: "Acolhimento e orientação para casais em segunda união que buscam viver a sua fé e participar na vida da comunidade."},
		{Name: "Conversa com o Padre (Agendamento)", Description: "Precisa de orientação espiritual, confissão ou apenas uma conversa? Consulte a agenda e marque um horário com o pároco."},
		{Name: "Dízimo (Contribuição Consciente)", Description: "Seja um dizimista e ajude a sua paróquia a evangelizar. A sua contribuição é um ato de fé, amor e partilha."},
	}
	db.Create(&services)

	pastorais := []Pastoral{
		{Name: "Pastoral da Liturgia", Description: "Responsável por preparar e animar as celebrações, tornando-as mais vivas e participativas.", MeetingTime: "Sábados, 16h00", MeetingLocation: "Sala 1, Centro Catequético"},
		{Name: "Pastoral do Dízimo", Description: "Equipa dedicada a conscientizar a comunidade sobre a importância da contribuição para a manutenção e evangelização da paróquia.", MeetingTime: "Primeira terça-feira do mês, 20h00", MeetingLocation: "Salão Paroquial"},
		{Name: "Pastoral da Acolhida", Description: "Recebe com alegria todos os fiéis nas missas e eventos, fazendo com que todos se sintam em casa.", MeetingTime: "Reuniões esporádicas, contactar a secretaria", MeetingLocation: "A definir"},
		{Name: "Pastoral Familiar", Description: "Apoia e promove a família como igreja doméstica, através de encontros, formações e eventos.", MeetingTime: "Última sexta-feira do mês, 19h30", MeetingLocation: "Salão Paroquial"},
	}
	db.Create(&pastorais)
}

