FROM node:18-alpine

# Define o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copia primeiro os arquivos de manifesto para aproveitar o cache do Docker
COPY package*.json ./

# Instala todas as dependências
RUN npm install

# Copia TODO o resto do código (incluindo as pastas 'public' e 'src')
COPY . .

# ---- PASSO DE DEPURAÇÃO ----
# O comando abaixo vai nos mostrar exatamente o que foi copiado para dentro do /app
RUN echo "--- LISTANDO ARQUIVOS DENTRO DO CONTÊINER ---" && ls -laR /app

# Expõe a porta que o React usa
EXPOSE 3000

# O comando para iniciar o servidor de desenvolvimento
CMD ["npm", "start"]

