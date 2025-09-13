Plataforma da Paróquia Santo Antônio de Marília - SP
📖 Visão Geral
Este projeto é uma plataforma web completa projetada para centralizar e digitalizar os serviços, eventos e contribuições da Paróquia Santo Antônio de Marília. A plataforma oferece um portal unificado para os paroquianos se registrarem, se inscreverem em cursos e pastorais, e realizarem suas contribuições do dízimo de forma online.

✨ Funcionalidades Principais
Autenticação de Usuários: Cadastro e login seguros para os paroquianos.

Portal de Serviços: Inscrições online para:

Batismo (Curso de Pais e Padrinhos)

Catequese Infantil e de Adultos

Curso de Noivos e agendamento de casamentos

Encontro de Casais com Cristo (ECC)

Curso de Segunda União

Agendamento de conversas com o padre.

Contribuição do Dízimo: Área para se registrar como dizimista e realizar contribuições via PIX, Cartão de Crédito e Boleto (simulado).

Vitrine de Pastorais: Espaço para cada pastoral apresentar seus serviços e horários.

Informações da Paróquia: Seção com a história da paróquia, horários de missas e calendário litúrgico.

Integração Social: Feeds do Instagram e Facebook incorporados na página inicial.

🛠️ Arquitetura e Tecnologias
A plataforma foi construída com uma arquitetura de microsserviços desacoplada, utilizando tecnologias modernas para garantir performance, escalabilidade e manutenibilidade.

Backend: Go (Golang) com o framework Gin para criar uma API RESTful rápida e eficiente.

Frontend: React com Tailwind CSS para uma interface de usuário moderna, reativa e totalmente responsiva.

Banco de Dados: PostgreSQL, um banco de dados relacional robusto e confiável.

Containerização: Docker e Docker Compose para criar um ambiente de desenvolvimento consistente e simplificado.

🚀 Como Executar o Projeto Localmente
Siga os passos abaixo para configurar e rodar a plataforma em seu ambiente de desenvolvimento.

Pré-requisitos
Docker

Docker Compose

Passos para Instalação
Clone o Repositório:

# (Em um ambiente real, você executaria este comando)
# git clone <url-do-repositorio>
# cd <nome-do-repositorio>

Por enquanto, salve os arquivos gerados nesta conversa em suas respectivas pastas (backend/ e frontend/).

Estrutura de Pastas:
Certifique-se de que sua estrutura de pastas esteja assim:

.
├── backend/
│   ├── main.go
│   ├── handlers.go
│   └── models.go
├── frontend/
│   └── App.jsx
├── docker-compose.yml
└── README.md

Inicie os Contêineres:
Abra seu terminal na raiz do projeto e execute o seguinte comando:

docker-compose up --build

O comando irá construir as imagens Docker para o backend e o frontend, baixar a imagem do PostgreSQL e iniciar os três contêineres.

Acesse a Plataforma:

Frontend (React): Abra seu navegador e acesse http://localhost:3000

Backend (API Go): A API estará disponível em http://localhost:8080

🕹️ Endpoints da API (Exemplos)
GET /api/services: Retorna uma lista de todos os serviços da paróquia.

POST /api/register: Registra um novo usuário.

POST /api/login: Autentica um usuário.