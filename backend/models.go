package main

import (
	"gorm.io/gorm"
)

// --- Modelos da Base de Dados ---

// User representa um paroquiano registado na plataforma.
type User struct {
	gorm.Model
	Name     string `json:"name"`
	Email    string `json:"email" gorm:"unique"`
	Password string `json:"-" gorm:"size:255"`
}

// Service representa um serviço ou sacramento oferecido pela paróquia.
type Service struct {
	gorm.Model
	Name        string `json:"name"`
	Description string `json:"description"`
}

// Pastoral representa uma pastoral ou movimento da paróquia.
type Pastoral struct {
	gorm.Model
	Name        string `json:"name"`
	Description string `json:"description"`
	MeetingInfo string `json:"meeting_info"`
}

// Registration representa a inscrição de um utilizador num serviço.
type Registration struct {
	gorm.Model
	UserID    uint    `json:"user_id"`
	ServiceID uint    `json:"service_id"`
	Status    string  `json:"status"`
	Service   Service `json:"service" gorm:"foreignKey:ServiceID"`
}

// LoginInput define a estrutura para os dados de entrada do login.
type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Contribution representa uma contribuição de dízimo.
type Contribution struct {
	gorm.Model
	UserID uint    `json:"user_id"`
	Value  float64 `json:"value"`
	Method string  `json:"method"` // Ex: "PIX", "Cartão", "Boleto"
	Status string  `json:"status"` // Ex: "Pendente", "Confirmado"
}

// MassTime representa um horário de missa ou evento.
type MassTime struct {
	gorm.Model
	Day         string `json:"day"`         // Ex: "Domingo", "Segunda-feira"
	Time        string `json:"time"`        // Ex: "07h00", "19h30"
	Location    string `json:"location"`    // Ex: "Matriz", "Capela São Carlos"
	Description string `json:"description"` // Ex: "Missa", "Novena N. Sra. Perpétuo Socorro"
}

