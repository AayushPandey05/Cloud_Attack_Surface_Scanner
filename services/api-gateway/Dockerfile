# Stage 1: Build Environment
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the gateway source code
COPY . .

# Stage 2: Production Environment
FROM node:20-alpine
WORKDIR /usr/src/app

# Copy only what was built in Stage 1
COPY --from=builder /usr/src/app ./

# Expose the port your API runs on
EXPOSE 3000

# Start the service (Update 'server.js' if your main file is named differently)
CMD ["node", "server.js"]