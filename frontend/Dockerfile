# Estágio 1: Construir a aplicação React
FROM node:18-alpine AS builder

WORKDIR /app

# Copia o package.json e instala as dependências
COPY package*.json ./
RUN npm install

# Copia todo o código fonte e constrói a versão de produção
COPY . .
RUN npm run build

# Estágio 2: Servir a aplicação com Nginx
FROM nginx:stable-alpine

# Copia os ficheiros estáticos construídos do estágio anterior
COPY --from=builder /app/build /usr/share/nginx/html

# Copia a nossa configuração personalizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta 80, que é a porta padrão para web
EXPOSE 80

# O comando para iniciar o Nginx já está incluído na imagem base
CMD ["nginx", "-g", "daemon off;"]

