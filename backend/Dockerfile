# Estágio 1: Build da aplicação
FROM golang:1.23-alpine AS builder

# Define o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copia os arquivos de módulo e dependências
COPY go.mod ./
COPY go.sum ./

# Copia todo o código fonte da aplicação ANTES de baixar dependências.
# Isso é necessário para que o comando 'go mod tidy' possa ler o código
# e corrigir o arquivo go.sum.
COPY *.go ./

# 'go mod tidy' garante que os arquivos go.mod e go.sum estão corretos
# e alinhados com todos os pacotes importados no código-fonte.
# Este comando resolve o erro "missing go.sum entry".
RUN go mod tidy

# Compila a aplicação Go para um executável estático
# O próprio 'go build' vai baixar as dependências verificadas pelo 'tidy'.
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /paroquia-backend .

# ---
# Estágio 2: Imagem final, otimizada e segura
FROM alpine:latest

# Define o diretório de trabalho
WORKDIR /root/

# Copia o executável compilado do estágio de build para a imagem final
COPY --from=builder /paroquia-backend .

# Expõe a porta 8080 para que o tráfego possa chegar ao nosso contêiner
EXPOSE 8080

# Comando para executar a aplicação quando o contêiner iniciar
CMD ["./paroquia-backend"]

