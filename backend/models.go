package main

import (
	"gorm.io/gorm"
	
)

// --- Estruturas de Dados / Modelos ---

// User representa um paroquiano registado na plataforma.
type User struct {
	gorm.Model
	Name     string `json:"name"`
	Email    string `json:"email" gorm:"unique"`
	Password string `json:"-" gorm:"size:255"` // A senha nunca deve ser enviada no JSON
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
	Name             string `json:"name"`
	Description      string `json:"description"`
	MeetingTime      string `json:"meeting_time"`
	MeetingLocation  string `json:"meeting_location"`
}

// Registration representa a inscrição de um User num Service.
type Registration struct {
    gorm.Model
    UserID    uint   `json:"user_id"`
    ServiceID uint   `json:"service_id"`
    Status    string `json:"status"` // Ex: "Pendente", "Confirmado"
    User      User
    Service   Service
}

// --- Estruturas para entrada de dados ---

// LoginInput define os campos necessários para o login.
type LoginInput struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

