FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (use npm install instead of npm ci to be more forgiving)
RUN npm install --omit=dev

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Start the server
CMD ["node", "dist/index.js"]
