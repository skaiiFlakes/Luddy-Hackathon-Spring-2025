# Use the official Python image as the base image
FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    libsndfile1 \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Copy requirements.txt
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Python files
COPY app.py whisper_service.py feedback_service.py ./

# Copy the rest of the application code
COPY . .

# Create a startup script to run Ollama in the background
RUN echo '#!/bin/bash\n\
# Start Ollama in the background\n\
ollama serve &\n\
\n\
# Wait for Ollama to start\n\
echo "Waiting for Ollama to start..."\n\
sleep 5\n\
\n\
# Pull the Llama3 model\n\
echo "Pulling Llama3 model..."\n\
ollama pull llama3\n\
\n\
# Start the FastAPI server\n\
echo "Starting FastAPI server..."\n\
exec uvicorn app:app --host 0.0.0.0 --port 8000\n\
' > /app/start.sh

# Make the startup script executable
RUN chmod +x /app/start.sh

# Expose the port FastAPI runs on (default is 8000)
EXPOSE 8000

# Start the services using the startup script
CMD ["/app/start.sh"]