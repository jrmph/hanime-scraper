# Use official Puppeteer image (Includes Node + Chrome + Linux Libs)
FROM ghcr.io/puppeteer/puppeteer:21.5.0

# Switch to root user to perform setup
USER root

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (ignoring dev dependencies)
RUN npm ci --omit=dev

# Copy app source
COPY . .

# Switch back to the specialized puppeteer user for security
USER pptruser

# Expose port 3000 (standard, though Render overrides this internally)
EXPOSE 3000

# Start command
CMD [ "node", "index.js" ]