# Use official Puppeteer image
FROM ghcr.io/puppeteer/puppeteer:21.5.0

# Switch to root user to perform setup
USER root

# Create app directory
WORKDIR /usr/src/app

# Copy package files (package.json)
COPY package*.json ./

# CHANGE: Use 'npm install' instead of 'npm ci'.
# 'npm ci' requires a package-lock.json file to exist.
# 'npm install' will simply install dependencies based on package.json.
RUN npm install

# Copy app source
COPY . .

# Switch back to the specialized puppeteer user for security
USER pptruser

# Expose port 3000
EXPOSE 3000

# Start command
CMD [ "node", "index.js" ]