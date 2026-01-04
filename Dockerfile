

FROM node:20-alpine

# Install Chrome dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

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
