# Use the official Node.js image as the base image
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port Next.js runs on (default is 3000)
EXPOSE 3000

# Start the Next.js development server
CMD ["npm", "run", "dev"]
