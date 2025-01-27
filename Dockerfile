# Use a base image (e.g., Node.js for a Node.js application)
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

RUN mkdir -p /imlystudios/uploads && \
    mkdir -p /imlystudios/logs && \
    chown -R root:root /imlystudios/uploads && \
    chmod -R 755 /imlystudios/uploads && \
    chmod -R 755 /imlystudios/logs

USER root

# Expose the application port (replace with your app's port)
EXPOSE 3050

# Define the command to run your application
CMD ["npm", "start"]


