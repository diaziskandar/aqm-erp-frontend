# Tahap 1: Build aplikasi React dengan Vite
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Tahap 2: Sajikan menggunakan Nginx
FROM nginx:alpine
# Menyalin hasil build dari Vite ke direktori public Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Menyalin file kustom nginx.conf untuk mengatasi error 404 saat refresh route React
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]