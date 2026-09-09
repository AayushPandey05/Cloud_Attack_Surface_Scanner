# Stage 1: Build Environment
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy the slack bot source code
COPY . .

# Stage 2: Production Environment
FROM node:20-alpine
WORKDIR /usr/src/app

# Copy only what was built in Stage 1
COPY --from=builder /usr/src/app ./

# Start the Slack bot service
CMD ["node", "scan-slack.js"]