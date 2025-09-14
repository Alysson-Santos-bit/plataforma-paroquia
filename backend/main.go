package main

import (
	"log"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Variável global para o banco de dados, acessível por outros ficheiros do pacote
var db *gorm.DB
var err error

func main() {
	// --- NOSSA MENSAGEM DE VERIFICAÇÃO FINAL ---
	log.Println("--- EXECUTANDO VERSÃO FINAL COM CORS ESPECÍFICO E HEALTHCHECK ---")

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=db user=user password=password dbname=paroquia_db port=5432 sslmode=disable"
	}

	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Não foi possível conectar ao banco de dados:", err)
	}
	log.Println("Conexão com o banco de dados estabelecida com sucesso.")

	// Migra os modelos definidos em models.go
	db.AutoMigrate(&User{}, &Service{}, &Pastoral{}, &Registration{})
	log.Println("Banco de dados migrado com sucesso.")

	// Adiciona dados iniciais se as tabelas estiverem vazias
	seedDatabase()

	router := gin.Default()

	// --- CONFIGURAÇÃO DE CORS ESPECÍFICA E ROBUSTA ---
	// Em vez de permitir qualquer origem, especificamos exatamente a origem do nosso frontend.
	config := cors.Config{
		AllowOrigins:     []string{"https://glorious-palm-tree-g4p549q76rqg29q96-3000.app.github.dev"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	router.Use(cors.New(config))

	// Agrupa as rotas da API sob o prefixo /api
	api := router.Group("/api")
	{
		api.POST("/register", RegisterUser)
		api.POST("/login", LoginUser)
		api.GET("/parish-info", GetParishInfo)
		api.GET("/services", GetServices)
		api.GET("/pastorais", GetPastorals)
		api.POST("/registrations", CreateRegistration)
	}

	// Rota de teste para verificar se o servidor está no ar
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	log.Printf("Servidor backend iniciado em http://localhost:8080")
	router.Run(":8080")
}

// seedDatabase insere os dados iniciais no banco de dados, se necessário
func seedDatabase() {
	var serviceCount int64
	db.Model(&Service{}).Count(&serviceCount)
	if serviceCount == 0 {
		initialServices := []Service{
			{Name: "Batismo (Curso de Pais e Padrinhos)", Description: "Prepare-se para o sacramento do batismo, o primeiro passo na vida cristã."},
			{Name: "Catequese Infantil", Description: "Iniciação à vida cristã para crianças, preparando para a Primeira Eucaristia e Crisma."},
			{Name: "Catequese de Adultos", Description: "Para adultos que desejam receber os sacramentos da iniciação cristã."},
			{Name: "Curso de Noivos", Description: "Preparação para o sacramento do matrimônio, fortalecendo os laços do casal."},
			{Name: "Matrimônio", Description: "Agende a celebração do seu casamento em nossa paroquia."},
			{Name: "Encontro de Casais com Cristo (ECC)", Description: "Uma experiência para renovar o amor e a fé no matrimônio."},
		}
		db.Create(&initialServices)
		log.Println("Serviços iniciais cadastrados.")
	}

	var pastoralCount int64
	db.Model(&Pastoral{}).Count(&pastoralCount)
	if pastoralCount == 0 {
		initialPastorals := []Pastoral{
			{Name: "Pastoral da Acolhida", Description: "Recebemos com alegria todos que chegam para as celebrações.", MeetingTime: "Durante as missas", MeetingLocation: "Entrada da Igreja"},
			{Name: "Pastoral do Dízimo", Description: "Conscientização sobre a importância da contribuição para a manutenção da casa do Pai.", MeetingTime: "Primeira terça-feira do mês, 20h", MeetingLocation: "Salão Paroquial"},
			{Name: "Legião de Maria", Description: "Movimento de leigos com a missão de evangelizar e visitar os doentes.", MeetingTime: "Toda segunda-feira, 15h", MeetingLocation: "Sala 2"},
		}
		db.Create(&initialPastorals)
		log.Println("Pastorais iniciais cadastradas.")
	}
}

