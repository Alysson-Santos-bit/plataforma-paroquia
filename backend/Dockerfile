# Estágio 1: Build da aplicação
FROM golang:1.18-alpine AS builder

# Define o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copia os arquivos de módulo e baixa as dependências
# Isso otimiza o cache do Docker, pois as dependências só são baixadas novamente se o go.mod/sum mudar.
COPY go.mod ./
COPY go.sum ./
RUN go mod download

# Copia todo o código fonte da aplicação
COPY *.go ./

# Compila a aplicação Go.
# CGO_ENABLED=0 desabilita o CGO para criar um binário estático.
# -o /app/main cria o executável com o nome "main" no diretório /app
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/main .

# Estágio 2: Imagem final, otimizada e segura
FROM alpine:latest

WORKDIR /root/

# Copia apenas o binário compilado do estágio de build.
# Isso resulta em uma imagem muito menor e mais segura, pois não contém o código fonte ou ferramentas de build.
COPY --from=builder /app/main .

# Expõe a porta que a aplicação Go vai usar
EXPOSE 8080

# Comando para executar a aplicação quando o contêiner iniciar
CMD ["./main"]
