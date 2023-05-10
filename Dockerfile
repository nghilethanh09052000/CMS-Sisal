FROM ubuntu

WORKDIR /usr/src/app

RUN apt-get update
RUN apt-get install npm -y
RUN apt-get install nginx -y

COPY . .

RUN mv .env.example .env

ENV CI=false
RUN npm install -f
RUN npm run build

EXPOSE 8080

# Start 
COPY docker-entrypoint.sh /

# only for local
RUN apt-get install dos2unix
RUN dos2unix docker-entrypoint.sh

RUN chmod +x docker-entrypoint.sh
CMD ["/bin/bash", "-c", "/usr/src/app/docker-entrypoint.sh"]
