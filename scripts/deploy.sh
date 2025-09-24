#!/bin/bash

# Microsoft Teams AI Agent Deployment Script
# This script handles deployment to different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to build the application
build_app() {
    print_status "Building the application..."
    
    # Install dependencies
    npm run install:all
    
    # Build React app
    cd client
    npm run build
    cd ..
    
    print_success "Application built successfully"
}

# Function to create deployment package
create_package() {
    print_status "Creating deployment package..."
    
    # Create deployment directory
    mkdir -p deployment/package
    
    # Copy server files
    cp -r server deployment/package/
    cp package*.json deployment/package/
    cp .env deployment/package/ 2>/dev/null || print_warning "No .env file found"
    
    # Copy built React app
    cp -r client/build deployment/package/public
    
    # Copy configuration files
    cp teams-app-manifest.json deployment/package/
    cp docker-compose.yml deployment/package/
    cp Dockerfile deployment/package/
    cp nginx.conf deployment/package/
    
    # Create deployment zip
    cd deployment/package
    zip -r ../teams-ai-agent-deployment.zip .
    cd ../..
    
    print_success "Deployment package created: deployment/teams-ai-agent-deployment.zip"
}

# Function to deploy to Azure
deploy_azure() {
    print_status "Deploying to Azure..."
    
    if ! command_exists az; then
        print_error "Azure CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if logged in to Azure
    if ! az account show >/dev/null 2>&1; then
        print_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi
    
    # Set environment variables
    RESOURCE_GROUP=${AZURE_RESOURCE_GROUP:-"teams-ai-agent-rg"}
    APP_NAME=${AZURE_APP_NAME:-"teams-ai-agent"}
    LOCATION=${AZURE_LOCATION:-"East US"}
    
    # Create resource group if it doesn't exist
    az group create --name $RESOURCE_GROUP --location "$LOCATION" 2>/dev/null || true
    
    # Create App Service plan
    az appservice plan create --name "${APP_NAME}-plan" --resource-group $RESOURCE_GROUP --sku B1 --is-linux 2>/dev/null || true
    
    # Create App Service
    az webapp create --resource-group $RESOURCE_GROUP --plan "${APP_NAME}-plan" --name $APP_NAME --runtime "NODE|18-lts" 2>/dev/null || true
    
    # Configure app settings
    if [ -f .env ]; then
        print_status "Configuring app settings..."
        az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $APP_NAME --settings @.env
    fi
    
    # Deploy the app
    print_status "Deploying application..."
    az webapp deployment source config-zip --resource-group $RESOURCE_GROUP --name $APP_NAME --src deployment/teams-ai-agent-deployment.zip
    
    print_success "Deployed to Azure App Service: https://$APP_NAME.azurewebsites.net"
}

# Function to deploy to AWS
deploy_aws() {
    print_status "Deploying to AWS..."
    
    if ! command_exists aws; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if logged in to AWS
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        print_error "Not logged in to AWS. Please run 'aws configure' first."
        exit 1
    fi
    
    # Set environment variables
    CLUSTER_NAME=${AWS_CLUSTER_NAME:-"teams-ai-agent"}
    SERVICE_NAME=${AWS_SERVICE_NAME:-"teams-ai-agent-service"}
    REGION=${AWS_REGION:-"us-east-1"}
    
    # Create ECS cluster if it doesn't exist
    aws ecs create-cluster --cluster-name $CLUSTER_NAME --region $REGION 2>/dev/null || true
    
    # Build and push Docker image
    print_status "Building Docker image..."
    docker build -t teams-ai-agent .
    
    # Get AWS account ID
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ECR_REPO="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/teams-ai-agent"
    
    # Create ECR repository
    aws ecr create-repository --repository-name teams-ai-agent --region $REGION 2>/dev/null || true
    
    # Login to ECR
    aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_REPO
    
    # Tag and push image
    docker tag teams-ai-agent:latest $ECR_REPO:latest
    docker push $ECR_REPO:latest
    
    print_success "Docker image pushed to ECR: $ECR_REPO"
    print_warning "ECS service deployment requires additional configuration"
}

# Function to deploy with Docker
deploy_docker() {
    print_status "Deploying with Docker Compose..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install it first."
        exit 1
    fi
    
    # Build and start services
    docker-compose up -d --build
    
    print_success "Deployed with Docker Compose"
    print_status "Application is running at http://localhost"
}

# Function to deploy to Kubernetes
deploy_kubernetes() {
    print_status "Deploying to Kubernetes..."
    
    if ! command_exists kubectl; then
        print_error "kubectl is not installed. Please install it first."
        exit 1
    fi
    
    # Check if connected to Kubernetes cluster
    if ! kubectl cluster-info >/dev/null 2>&1; then
        print_error "Not connected to Kubernetes cluster. Please configure kubectl first."
        exit 1
    fi
    
    # Create Kubernetes manifests
    cat > k8s-deployment.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: teams-ai-agent
spec:
  replicas: 2
  selector:
    matchLabels:
      app: teams-ai-agent
  template:
    metadata:
      labels:
        app: teams-ai-agent
    spec:
      containers:
      - name: teams-ai-agent
        image: teams-ai-agent:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3001"
---
apiVersion: v1
kind: Service
metadata:
  name: teams-ai-agent-service
spec:
  selector:
    app: teams-ai-agent
  ports:
  - port: 80
    targetPort: 3001
  type: LoadBalancer
EOF
    
    # Apply manifests
    kubectl apply -f k8s-deployment.yaml
    
    print_success "Deployed to Kubernetes"
}

# Main script
main() {
    echo "🚀 Microsoft Teams AI Agent Deployment Script"
    echo "=============================================="
    
    # Parse command line arguments
    case "${1:-help}" in
        "build")
            build_app
            ;;
        "package")
            build_app
            create_package
            ;;
        "azure")
            build_app
            create_package
            deploy_azure
            ;;
        "aws")
            build_app
            create_package
            deploy_aws
            ;;
        "docker")
            build_app
            deploy_docker
            ;;
        "kubernetes"|"k8s")
            build_app
            deploy_kubernetes
            ;;
        "all")
            build_app
            create_package
            print_status "Deployment package ready for manual deployment"
            ;;
        "help"|*)
            echo "Usage: $0 {build|package|azure|aws|docker|kubernetes|all|help}"
            echo ""
            echo "Commands:"
            echo "  build      - Build the application"
            echo "  package    - Build and create deployment package"
            echo "  azure      - Deploy to Azure App Service"
            echo "  aws        - Deploy to AWS ECS"
            echo "  docker     - Deploy with Docker Compose"
            echo "  kubernetes - Deploy to Kubernetes"
            echo "  all        - Build and package for manual deployment"
            echo "  help       - Show this help message"
            echo ""
            echo "Environment variables:"
            echo "  AZURE_RESOURCE_GROUP - Azure resource group name"
            echo "  AZURE_APP_NAME       - Azure app name"
            echo "  AZURE_LOCATION       - Azure location"
            echo "  AWS_CLUSTER_NAME     - AWS ECS cluster name"
            echo "  AWS_SERVICE_NAME     - AWS ECS service name"
            echo "  AWS_REGION           - AWS region"
            ;;
    esac
}

# Run main function
main "$@"
