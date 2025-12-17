# Use Official Puppeteer Image (Contains Chrome + Node.js)
FROM ghcr.io/puppeteer/puppeteer:latest

# Switch to root to install deps
USER root

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Switch back to secure user
USER pptruser

# Expose Port
EXPOSE 3000

# Start
CMD [ "node", "index.js" ]