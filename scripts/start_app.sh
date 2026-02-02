#!/bin/bash

# CloudRetail - Backend Startup Script
# Run this on your EC2 instances to start the services

echo "Starting CloudRetail Services..."

# 1. Ensure we are in the project root
# cd /home/ec2-user/cloudretail

# 2. Pull latest images (optional, but recommended if you just pushed to ECR)
# docker-compose -f docker-compose.prod.yml pull

# 3. Start the stack
docker-compose -f docker-compose.prod.yml up -d

echo "------------------------------------------------"
echo "Services started in background."
echo "Check status with: docker-compose -f docker-compose.prod.yml ps"
echo "Check logs with: docker-compose -f docker-compose.prod.yml logs -f"
echo "------------------------------------------------"
