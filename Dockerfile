# Dev image — Vite dev server
FROM node:20-alpine

WORKDIR /app

# Install deps first for layer caching
COPY package.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
