# Use the official Python image as the base image
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update
RUN apt-get install -y --no-install-recommends curl ca-certificates
RUN apt-get install -y ffmpeg git libsndfile1

# Install UV
ADD https://astral.sh/uv/install.sh /uv-installer.sh
RUN sh /uv-installer.sh && rm /uv-installer.sh
ENV PATH="/root/.local/bin/:$PATH"

WORKDIR /app

EXPOSE 5000

CMD ["uv", "run", "src/main.py"]