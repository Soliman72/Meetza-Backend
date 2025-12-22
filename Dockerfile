# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for nodemon)
RUN npm ci

# Copy application files
COPY . .

# Create uploads directory if it doesn't exist
RUN mkdir -p uploads

# Expose the port
EXPOSE 4000

# Start the application
CMD ["npm", "run", "dev"]

