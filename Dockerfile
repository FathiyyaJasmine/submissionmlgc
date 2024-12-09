# Menggunakan Node.js versi 16 sebagai base image
FROM node:16

# Menentukan working directory di dalam container
WORKDIR /usr/src/app

# Copy file package.json dan package-lock.json (untuk dependency)
COPY package*.json ./

# Install dependencies menggunakan npm
RUN npm install

# Copy semua file dari direktori host ke working directory container
COPY . .

# Expose port 3000 agar server bisa diakses
EXPOSE 8080
ENV PORT=8080

# Menjalankan perintah untuk memulai aplikasi
CMD ["node", "src/app.js"]
