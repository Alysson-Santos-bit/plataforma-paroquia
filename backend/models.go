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
	Password string `json:"-"` // O hífen indica para não expor este campo no JSON
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
	Status    string  `json:"status"`  // Ex: "Pendente", "Confirmada", "Concluída"
	// A etiqueta gorm é a correção crucial para o Preload funcionar corretamente.
	Service   Service `json:"service" gorm:"foreignKey:ServiceID"` 
}

// LoginInput define a estrutura para os dados de entrada do login.
type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

