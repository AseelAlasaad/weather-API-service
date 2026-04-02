#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Default service if none specified
DEFAULT_SERVICE="."

SERVICE=${1:-$DEFAULT_SERVICE}

echo -e "${YELLOW}=== Building service: $SERVICE ===${NC}"

# Check Docker
command -v docker >/dev/null 2>&1 || { echo -e "${RED}Docker not installed!${NC}"; exit 1; }

echo -e "${YELLOW}Fixing permissions...${NC}"
sudo chown -R $USER:$USER .
chmod -R u+rwX,go+rX,go-w .

echo -e "${YELLOW}Cleaning old containers/images for weather-service...${NC}"
docker rm -f $(docker ps -a -q --filter "name=^/weather-service$") 2>/dev/null || echo "No containers to remove"
docker rmi -f weather-service:latest 2>/dev/null || echo "No image to remove"

echo -e "${YELLOW}Cleaning dist folder...${NC}"
rm -rf "./dist" "./tsconfig.tsbuildinfo" 2>/dev/null || echo "No dist to remove"

echo -e "${YELLOW}Installing dependencies and building weather-service...${NC}"
npm install
npm run build
npm install --omit=dev

echo -e "${YELLOW}Building Docker image for weather-service...${NC}"
docker build -f Dockerfile.dev -t weather-service:latest --no-cache .
[ $? -ne 0 ] && { echo -e "${RED}Build failed for weather-service!${NC}"; exit 1; }

echo -e "${GREEN}✓ weather-service built successfully${NC}"

echo -e "${YELLOW}Starting weather-service with docker-compose...${NC}"
docker compose up -d --build weather-service || { echo -e "${RED}docker-compose failed!${NC}"; exit 1; }

echo -e "${GREEN}✓ weather-service started successfully${NC}"