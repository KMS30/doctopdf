# Use an official Node.js image as the base image
FROM node:18-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Install required libraries for Puppeteer (Chromium dependencies) and LibreOffice
RUN apt-get update && apt-get install -y \
  wget \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libgdk-pixbuf2.0-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  lsb-release \
  xdg-utils \
  chromium \
  libreoffice \
  --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Set the environment variable for Puppeteer to use the system-installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Copy the entire project directory into the container
COPY . .

# Expose the port the app will run on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
