# Use official Node.js 18 image (Alpine for smaller size)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first (for efficient caching)
COPY package*.json ./

# Install dependencies (only production to assume, but we might need devDeps if build scripts require them. 
# For now, standard install is fine)
RUN npm install

# Copy source code
COPY . .

# Expose the service port (4001 as per auth-service .env/config)
EXPOSE 4001

# Start the application
CMD ["npm", "start"]
