# CHANGE: Gamitin ang 'latest' para updated at walang warning
FROM ghcr.io/puppeteer/puppeteer:latest

# Switch to root user
USER root

# Working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
# --no-audit para mas mabilis at bawas logs
RUN npm install --no-audit

# Copy app source
COPY . .

# Switch back to pptruser
USER pptruser

# Expose port
EXPOSE 3000

# Start command
CMD [ "node", "index.js" ]