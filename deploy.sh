#!/bin/bash

# CV Filter Tool - Quick Deploy Script for Linux VPS
# This script helps you quickly deploy the application on your VPS

set -e

echo "🚀 CV Filter Tool - Deployment Script"
echo "======================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    if [ -f env.docker.example ]; then
        cp env.docker.example .env
        echo "✅ Created .env file. Please edit it with your values:"
        echo "   - DOCKER_USERNAME"
        echo "   - OPENAI_API_KEY"
        echo "   - NEXT_PUBLIC_API_URL"
        echo ""
        echo "Press Enter to continue after editing .env file..."
        read
    else
        echo "❌ env.docker.example not found. Please create .env file manually."
        exit 1
    fi
fi

# Load environment variables
source .env

# Check if DOCKER_USERNAME is set
if [ -z "$DOCKER_USERNAME" ] || [ "$DOCKER_USERNAME" = "your_dockerhub_username" ]; then
    echo "❌ Please set DOCKER_USERNAME in .env file"
    exit 1
fi

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "your_openai_api_key_here" ]; then
    echo "❌ Please set OPENAI_API_KEY in .env file"
    exit 1
fi

echo "📦 Pulling latest images from Docker Hub..."
docker-compose pull

echo ""
echo "🔧 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📍 Services are running:"
    echo "   - Frontend: http://localhost:3000"
    echo "   - Backend API: http://localhost:8000"
    echo "   - API Docs: http://localhost:8000/docs"
    echo ""
    echo "📊 To view logs: docker-compose logs -f"
    echo "🛑 To stop: docker-compose down"
    echo "🔄 To restart: docker-compose restart"
else
    echo ""
    echo "⚠️  Services started but may not be healthy yet."
    echo "Check status with: docker-compose ps"
    echo "View logs with: docker-compose logs"
fi

