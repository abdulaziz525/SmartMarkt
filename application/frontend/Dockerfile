# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Build the React application
RUN npm run build

# Serve stage
FROM nginx:alpine

# Copy custom Nginx configuration to support SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose web server port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
