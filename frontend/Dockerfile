# Usa uma imagem base do Node.js para o ambiente de desenvolvimento
FROM node:18-alpine

# Define o diretório de trabalho
WORKDIR /app

# Copia o package.json e package-lock.json (se existir)
# Isso otimiza o cache do Docker, instalando dependências apenas quando o arquivo muda.
COPY package.json ./

# Instala as dependências do projeto
RUN npm install

# Copia o restante dos arquivos da aplicação (no nosso caso, apenas o App.jsx)
COPY ./ /app/src

# Expõe a porta que o servidor de desenvolvimento do React usa
EXPOSE 3000

# Comando para iniciar o servidor de desenvolvimento
CMD ["npm", "start"]
