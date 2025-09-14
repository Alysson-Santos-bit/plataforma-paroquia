package main

import "gorm.io/gorm"

// User representa um paroquiano registado na plataforma
type User struct {
	gorm.Model
	Name     string `json:"name"`
	Email    string `json:"email" gorm:"unique"`
	Password string `json:"-"` // O - impede que o campo seja enviado no JSON
}

// Service representa um serviço oferecido pela paróquia (catequese, batismo, etc.)
type Service struct {
	gorm.Model
	Name        string `json:"name"`
	Description string `json:"description"`
}

// Pastoral representa uma pastoral da paróquia
type Pastoral struct {
	gorm.Model
	Name            string `json:"name"`
	Description     string `json:"description"`
	MeetingTime     string `json:"meeting_time"`
	MeetingLocation string `json:"meeting_location"`
}

// Registration representa a inscrição de uma pessoa num serviço
type Registration struct {
	gorm.Model
	Name      string  `json:"name"`
	Email     string  `json:"email"`
	Phone     string  `json:"phone"`
	ServiceID uint    `json:"service_id"`
	Service   Service `json:"service"`
}

