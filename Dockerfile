FROM node:latest

WORKDIR /TCShell

COPY . .

RUN npm install

RUN npm run build
