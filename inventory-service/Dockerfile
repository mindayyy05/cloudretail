# Use official Node.js 18 image (Alpine for smaller size)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first (for efficient caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose the service port (4003 as per inventory-service .env/config)
EXPOSE 4003

# Start the application
CMD ["npm", "start"]
