# Use the official Puppeteer image (Includes Chrome)
FROM ghcr.io/puppeteer/puppeteer:latest

# Switch to root to configure permissions
USER root

# Working directory
WORKDIR /usr/src/app

# Copy package info
COPY package*.json ./

# ENVIRONMENT VARIABLES (THE FIX)
# 1. Skip downloading Chrome locally (because the image already has it)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
# 2. Tell Puppeteer where the global Chrome is located
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Switch back to secure user
USER pptruser

# Expose port
EXPOSE 3000

# Start
CMD [ "node", "index.js" ]