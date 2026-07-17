# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Build TypeScript code
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled JavaScript from builder
COPY --from=builder /app/dist ./dist

# Create a directory for the SQLite database and set permissions
RUN mkdir -p /app/data && chown -R node:node /app/data

# Use non-root user for better security
USER node

# Set environment variables
ENV PORT=3001
ENV DB_NAME=data/database.sqlite

# Expose backend port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
