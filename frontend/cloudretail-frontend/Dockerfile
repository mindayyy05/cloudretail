# Build Stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production Stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html

# Create a robust Nginx configuration for SPA and API proxying
RUN printf "server { \n\
    listen 80; \n\
    location / { \n\
    root /usr/share/nginx/html; \n\
    index index.html index.htm; \n\
    try_files \$uri \$uri/ /index.html; \n\
    } \n\
    # Proxy API requests to the Gateway Service \n\
    location /api/ { \n\
    proxy_pass http://cloudretail-gateway:4000; \n\
    proxy_set_header Host \$host; \n\
    proxy_set_header X-Real-IP \$remote_addr; \n\
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; \n\
    proxy_set_header X-Forwarded-Proto \$scheme; \n\
    } \n\
    }" > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
