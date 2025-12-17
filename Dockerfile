# Gamitin ang specific version para walang 'deprecated' warning
FROM ghcr.io/puppeteer/puppeteer:22.6.0

# Switch to root para makapag-setup
USER root

# Working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app files
COPY . .

# Switch back to secure user
USER pptruser

# Expose port
EXPOSE 3000

# Start
CMD [ "node", "index.js" ]