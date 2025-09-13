package main

import (
	"time"

	"gorm.io/gorm"
)

// User representa um paroquiano cadastrado na plataforma
type User struct {
	gorm.Model
	Name         string `json:"name"`
	Email        string `json:"email" gorm:"unique"`
	PasswordHash string `json:"-"` // O hífen evita que seja exposto na API
}

// Service representa um serviço ou curso oferecido pela paróquia
type Service struct {
	gorm.Model
	Name        string `json:"name"`
	Description string `json:"description"`
}

// Pastoral representa uma pastoral ou movimento da paróquia
type Pastoral struct {
	gorm.Model
	Name        string `json:"name"`
	Description string `json:"description"`
	MeetingInfo string `json:"meetingInfo"`
}

// Registration representa a inscrição de um usuário em um serviço
type Registration struct {
	gorm.Model
	// ID do usuário (se logado) poderia ser usado aqui
	// UserID      uint   `json:"userId"`
	UserName    string    `json:"userName"`
	UserEmail   string    `json:"userEmail"`
	UserPhone   string    `json:"userPhone"`
	ServiceID   uint      `json:"serviceId"`
	ServiceName string    `json:"serviceName"`
	Status      string    `json:"status"` // Ex: "Recebida", "Confirmada", "Lista de Espera"
	SubmittedAt time.Time `json:"submittedAt"`
}

// TithePayment representaria um pagamento do dízimo
// A implementação real exigiria integração com um gateway de pagamento
type TithePayment struct {
	gorm.Model
	UserID        uint
	Amount        float64
	PaymentMethod string // "pix", "credit_card", "boleto"
	Status        string // "pending", "paid", "failed"
	TransactionID string // ID do gateway de pagamento
}
