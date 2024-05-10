FROM node:lts

WORKDIR /TCShell

COPY . .

RUN npm install
