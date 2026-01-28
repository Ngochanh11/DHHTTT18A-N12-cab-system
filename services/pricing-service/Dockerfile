FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src ./src

EXPOSE 3008

CMD ["node", "src/app.js"]
