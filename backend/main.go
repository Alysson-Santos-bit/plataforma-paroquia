package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// DB é a instância global do banco de dados
var DB *gorm.DB

// connectDatabase inicializa a conexão com o banco de dados PostgreSQL
func connectDatabase() {
	var err error
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://user:password@localhost:5432/paroquia_db?sslmode=disable"
		log.Println("DATABASE_URL não definida, usando valor padrão.")
	}

	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Falha ao conectar ao banco de dados:", err)
	}

	log.Println("Conexão com o banco de dados estabelecida com sucesso.")

	// AutoMigrate vai criar as tabelas baseadas nos modelos (structs)
	err = DB.AutoMigrate(&User{}, &Service{}, &Pastoral{}, &Registration{})
	if err != nil {
		log.Fatal("Falha ao migrar o banco de dados:", err)
	}
	log.Println("Banco de dados migrado com sucesso.")
}

func main() {
	// Inicializa a conexão com o banco
	connectDatabase()
	seedDatabase() // Popula o banco com dados iniciais (opcional)

	// Inicializa o roteador Gin
	router := gin.Default()

	// Configura o CORS (Cross-Origin Resource Sharing) para permitir requisições do frontend
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"}, // URL do seu frontend React
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Agrupa as rotas da API sob o prefixo /api
	api := router.Group("/api")
	{
		// Rotas de autenticação
		api.POST("/register", RegisterUser)
		api.POST("/login", LoginUser)

		// Rotas de informações públicas
		api.GET("/parish-info", GetParishInfo)
		api.GET("/services", GetServices)
		api.GET("/pastorals", GetPastorals)

		// Rotas protegidas (exemplo, requerem autenticação no futuro)
		api.POST("/registrations", CreateRegistration)
	}

	// Rota de teste
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})

	log.Println("Servidor backend iniciado em http://localhost:8080")
	// Inicia o servidor na porta 8080
	if err := router.Run(":8080"); err != nil {
		log.Fatal("Falha ao iniciar o servidor:", err)
	}
}

// seedDatabase popula o banco com alguns dados iniciais para teste
func seedDatabase() {
	// Verifica se os serviços já existem para não duplicar
	var count int64
	DB.Model(&Service{}).Count(&count)
	if count == 0 {
		services := []Service{
			{Name: "Batismo - Curso de Pais e Padrinhos", Description: "Inscrição para o curso preparatório para o batismo de crianças."},
			{Name: "Catequese Infantil", Description: "Inscrições para a catequese para crianças e pré-adolescentes."},
			{Name: "Catequese de Adultos", Description: "Preparação para os sacramentos da iniciação cristã para adultos."},
			{Name: "Curso de Noivos", Description: "Curso preparatório obrigatório para casais que desejam se casar na igreja."},
			{Name: "Encontro de Casais com Cristo (ECC)", Description: "Movimento da Igreja Católica para casais."},
			{Name: "Agendamento de Casamento", Description: "Reserve a data para a sua cerimônia de casamento na paróquia."},
		}
		DB.Create(&services)
		log.Println("Serviços iniciais cadastrados.")
	}

	DB.Model(&Pastoral{}).Count(&count)
	if count == 0 {
		pastorals := []Pastoral{
			{Name: "Pastoral da Acolhida", Description: "Responsável por acolher os fiéis nas missas e eventos.", MeetingInfo: "Reuniões toda primeira sexta-feira do mês, às 19h30, no salão paroquial."},
			{Name: "Pastoral do Dízimo", Description: "Conscientização e organização da contribuição do dízimo.", MeetingInfo: "Reuniões no segundo sábado do mês, às 10h00, na sala 2."},
			{Name: "Ministério de Música", Description: "Responsável pelos cantos e louvores nas celebrações.", MeetingInfo: "Ensaios todas as quintas-feiras, às 20h00, na igreja."},
		}
		DB.Create(&pastorals)
		log.Println("Pastorais iniciais cadastradas.")
	}
}
