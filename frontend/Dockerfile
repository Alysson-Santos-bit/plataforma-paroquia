#--- ESTÁGIO 1: Compilar a Aplicação React ---
#Usamos uma imagem Node para instalar as dependências e compilar o projeto
FROM node:18-alpine as build

#Define o diretório de trabalho dentro do contentor
WORKDIR /app

#Copia o package.json e package-lock.json para instalar as dependências
COPY package*.json ./
RUN npm install

#Copia o resto dos ficheiros da aplicação (incluindo a pasta src)
COPY . .

#Executa o comando de compilação para gerar os ficheiros estáticos
RUN npm run build

#--- ESTÁGIO 2: Servir os Ficheiros com Nginx ---
#Usamos uma imagem Nginx leve para servir os ficheiros compilados
FROM nginx:1.25-alpine

#Copia os ficheiros estáticos compilados do estágio de 'build' para o diretório do Nginx
COPY --from=build /app/build /usr/share/nginx/html

#Copia o nosso ficheiro de configuração personalizado do Nginx para dentro do contentor
#Este ficheiro DEVE estar na mesma pasta que este Dockerfile
COPY nginx.conf /etc/nginx/conf.d/default.conf

#Expõe a porta 80 para permitir o tráfego de entrada
EXPOSE 80

#Comando para iniciar o Nginx quando o contentor arrancar
CMD ["nginx", "-g", "daemon off;"]