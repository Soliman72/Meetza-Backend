# Use Node.js Debian-based image for apt support (needed for MariaDB)
FROM node:18-bookworm-slim

# Install MariaDB server and dos2unix to fix line endings
RUN apt-get update && \
    apt-get install -y mariadb-server dos2unix ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy application files and database schema
COPY . .

# Make the start script executable and fix potential Windows line endings
RUN dos2unix /app/start.sh && chmod +x /app/start.sh

# Expose the Node.js port and MySQL port
EXPOSE 4000
EXPOSE 3306

# Start the application using the start script
CMD ["/app/start.sh"]
