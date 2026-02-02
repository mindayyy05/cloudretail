#!/bin/bash
set -e

# Configuration
ACCOUNT_ID="525945693121"
REGION="us-east-1"
REPO_URL="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

# List of services to build and push
# Format: "local_folder_name:ecr_repo_suffix"
# If suffix is not provided, it defaults to "cloudretail-<folder_name>"
services=(
    "auth-service"
    "product-service"
    "order-service"
    "inventory-service"
    "gateway-service"
    "frontend/cloudretail-frontend:cloudretail-frontend"
)

echo "Logging into AWS ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $REPO_URL

for entry in "${services[@]}"; do
    # Parse folder and repo name
    if [[ "$entry" == *":"* ]]; then
        folder="${entry%%:*}"
        repo_name="${entry##*:}"
    else
        folder="$entry"
        repo_name="cloudretail-$entry"
    fi

    echo "----------------------------------------------------------------"
    echo "Processing Service: $repo_name"
    echo "Source Folder: ./$folder"
    echo "----------------------------------------------------------------"
    
    # Check if folder exists
    if [ ! -d "./$folder" ]; then
        echo "Error: Directory ./$folder does not exist. Skipping."
        continue
    fi

    # Build
    echo "Building image for linux/amd64..."
    docker build --platform linux/amd64 -t $repo_name ./$folder
    
    # Tag
    echo "Tagging image..."
    docker tag $repo_name:latest $REPO_URL/$repo_name:latest
    
    # Push
    echo "Pushing to ECR..."
    docker push $REPO_URL/$repo_name:latest
    
    echo "Successfully pushed $repo_name"
done

echo "----------------------------------------------------------------"
echo "All services processed!"
