#!/bin/bash

# Define the image name (replace with your Docker Hub username and image name)
IMAGE_NAME="ksm30/doctopdf:latest"
CONTAINER_NAME="doctopdf-container"

# Pull the latest image from Docker Hub
echo "Pulling the latest Docker image..."
docker pull $IMAGE_NAME

# Check if the container is already running and stop it if necessary
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    echo "Stopping and removing existing container..."
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
fi

# Run the Docker container
echo "Running the Docker container..."
docker run -d -p 3000:3000 --name $CONTAINER_NAME $IMAGE_NAME

echo "The application is now running at http://localhost:3000"
