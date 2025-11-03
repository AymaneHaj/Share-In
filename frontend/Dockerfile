# frontend/Dockerfile

# 1. Build stage
FROM node:20-alpine as builder

# Set the working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Set environment variables
ENV NODE_ENV=production

# Build the application with less strict TS checking
RUN npm run build --skipLibCheck

# 2. Serve the application with Nginx
FROM nginx:alpine

# 1. Copy the built files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# 2. Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf