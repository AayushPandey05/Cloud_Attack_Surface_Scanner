# 1. Use a super lightweight Node.js engine
FROM node:20-alpine

# 2. Create a folder inside the container for our app
WORKDIR /app

# 3. Copy only the package files first
COPY package*.json ./

# 4. NEW: Install the Vercel CLI globally inside the container!
RUN npm install -g vercel

# 5. Install your Vanilla JS/Node dependencies
RUN npm install

# 6. Copy the rest of your scanner code into the container
COPY . .

# 7. Expose the port (Vercel dev usually runs on 3000)
EXPOSE 3000

# 8. The command to turn the scanner on
CMD ["sh", "-c", "vercel dev --token $VERCEL_TOKEN --yes"]