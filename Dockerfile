# Use Node.js Debian-based image for apt support (needed for MariaDB)
FROM node:18-bookworm-slim

# Install MariaDB server
RUN apt-get update && \
    apt-get install -y mariadb-server && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy application files and database schema
COPY . .

# Make the start script executable
RUN chmod +x /app/start.sh

# Expose the Node.js port and MySQL port
EXPOSE 4000
EXPOSE 3306

# Start the application using the start script
CMD ["/app/start.sh"]
