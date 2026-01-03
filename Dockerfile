
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (including devDependencies for building)
# Using npm install instead of ci to be more forgiving with lockfile
RUN npm install

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Expose port (Render sets PORT env var provided map is set, but this documents intent)
EXPOSE 3000

# Start server
CMD ["npm", "start"]
