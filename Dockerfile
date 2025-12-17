# Use the official Puppeteer image which includes Chrome
FROM ghcr.io/puppeteer/puppeteer:latest

# Switch to root user to allow installation
USER root

# Set the working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# CRITICAL: Tell Puppeteer NOT to download Chrome (we use the installed one)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Install dependencies
RUN npm install

# Copy the rest of the app files
COPY . .

# Switch back to the secure user provided by the image
USER pptruser

# Expose the port
EXPOSE 3000

# Start the app
CMD [ "node", "index.js" ]