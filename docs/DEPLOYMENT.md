# Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Microsoft Teams AI Agent Tab App across different environments and platforms.

## Prerequisites

### Required Tools
- Node.js 18+ and npm
- Docker and Docker Compose
- Azure CLI (for Azure deployment)
- AWS CLI (for AWS deployment)
- kubectl (for Kubernetes deployment)

### Required Accounts
- Microsoft Azure subscription
- AWS account with Bedrock access
- Topcoder MCP Gateway access
- Microsoft Teams admin access

## Environment Configuration

### 1. Azure AD App Registration

#### Create App Registration
```bash
# Login to Azure
az login

# Create app registration
az ad app create --display-name "Teams AI Agent" \
  --sign-in-audience AzureADMyOrg \
  --web-redirect-uris "https://your-domain.com/auth/callback"
```

#### Configure App Registration
1. Go to Azure Portal → App registrations
2. Select your app → Authentication
3. Add platform → Single-page application
4. Add redirect URI: `https://your-domain.com`
5. Enable "Access tokens" and "ID tokens"
6. Save configuration

#### Generate Client Secret
1. Go to Certificates & secrets
2. Click "New client secret"
3. Add description and expiration
4. Copy the secret value (save securely)

### 2. AWS Bedrock Configuration

#### Enable Bedrock Access
```bash
# Configure AWS CLI
aws configure

# Check Bedrock access
aws bedrock list-foundation-models --region us-east-1
```

#### Configure IAM Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0"
    }
  ]
}
```

### 3. Azure Key Vault Setup

#### Create Key Vault
```bash
# Create resource group
az group create --name teams-ai-agent-rg --location eastus

# Create Key Vault
az keyvault create --name teams-ai-agent-kv \
  --resource-group teams-ai-agent-rg \
  --location eastus
```

#### Add Secrets
```bash
# Add Azure AD secrets
az keyvault secret set --vault-name teams-ai-agent-kv \
  --name "AZURE-TENANT-ID" --value "your-tenant-id"

az keyvault secret set --vault-name teams-ai-agent-kv \
  --name "AZURE-CLIENT-ID" --value "your-client-id"

az keyvault secret set --vault-name teams-ai-agent-kv \
  --name "AZURE-CLIENT-SECRET" --value "your-client-secret"

# Add AWS secrets
az keyvault secret set --vault-name teams-ai-agent-kv \
  --name "AWS-ACCESS-KEY-ID" --value "your-aws-access-key"

az keyvault secret set --vault-name teams-ai-agent-kv \
  --name "AWS-SECRET-ACCESS-KEY" --value "your-aws-secret-key"

# Add MCP Gateway secrets
az keyvault secret set --vault-name teams-ai-agent-kv \
  --name "MCP-API-KEY" --value "your-mcp-api-key"
```

## Deployment Options

### Option 1: Azure App Service

#### Prerequisites
- Azure subscription
- Azure CLI installed and configured

#### Deploy to Azure App Service
```bash
# Set environment variables
export RESOURCE_GROUP="teams-ai-agent-rg"
export APP_NAME="teams-ai-agent"
export LOCATION="eastus"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create App Service plan
az appservice plan create --name "${APP_NAME}-plan" \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux

# Create App Service
az webapp create --resource-group $RESOURCE_GROUP \
  --plan "${APP_NAME}-plan" \
  --name $APP_NAME \
  --runtime "NODE|18-lts"

# Configure app settings
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
  NODE_ENV=production \
  AZURE_KEY_VAULT_URL=https://teams-ai-agent-kv.vault.azure.net/ \
  MCP_GATEWAY_URL=https://mcp.topcoder.com

# Deploy the application
npm run build
zip -r deployment.zip . -x "node_modules/*" ".git/*"
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --src deployment.zip
```

#### Configure Custom Domain (Optional)
```bash
# Add custom domain
az webapp config hostname add \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --hostname your-domain.com
```

### Option 2: AWS ECS

#### Prerequisites
- AWS account with ECS access
- AWS CLI configured
- Docker installed

#### Deploy to AWS ECS
```bash
# Set environment variables
export AWS_REGION="us-east-1"
export ECS_CLUSTER="teams-ai-agent"
export ECS_SERVICE="teams-ai-agent-service"

# Create ECS cluster
aws ecs create-cluster --cluster-name $ECS_CLUSTER --region $AWS_REGION

# Create ECR repository
aws ecr create-repository --repository-name teams-ai-agent --region $AWS_REGION

# Build and push Docker image
docker build -t teams-ai-agent .
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

docker tag teams-ai-agent:latest \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/teams-ai-agent:latest

docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/teams-ai-agent:latest

# Create task definition
cat > task-definition.json << EOF
{
  "family": "teams-ai-agent",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::$AWS_ACCOUNT_ID:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "teams-ai-agent",
      "image": "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/teams-ai-agent:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "AZURE_TENANT_ID",
          "valueFrom": "arn:aws:secretsmanager:$AWS_REGION:$AWS_ACCOUNT_ID:secret:teams-ai-agent/azure-tenant-id"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/teams-ai-agent",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create ECS service
aws ecs create-service \
  --cluster $ECS_CLUSTER \
  --service-name $ECS_SERVICE \
  --task-definition teams-ai-agent:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}"
```

### Option 3: Docker Compose

#### Prerequisites
- Docker and Docker Compose installed
- Domain name configured

#### Deploy with Docker Compose
```bash
# Clone repository
git clone <repository-url>
cd teams-ai-agent-mcp

# Configure environment
cp env.example .env
# Edit .env with your configuration

# Build and start services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

#### Configure Nginx (Optional)
```bash
# Generate SSL certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem

# Update nginx.conf with your domain
# Restart services
docker-compose restart nginx
```

### Option 4: Kubernetes

#### Prerequisites
- Kubernetes cluster
- kubectl configured
- Helm (optional)

#### Deploy to Kubernetes
```bash
# Create namespace
kubectl create namespace teams-ai-agent

# Create ConfigMap
kubectl create configmap teams-ai-agent-config \
  --from-env-file=.env \
  --namespace=teams-ai-agent

# Create Secret
kubectl create secret generic teams-ai-agent-secrets \
  --from-literal=azure-tenant-id="your-tenant-id" \
  --from-literal=azure-client-id="your-client-id" \
  --from-literal=azure-client-secret="your-client-secret" \
  --from-literal=aws-access-key-id="your-aws-key" \
  --from-literal=aws-secret-access-key="your-aws-secret" \
  --from-literal=mcp-api-key="your-mcp-key" \
  --namespace=teams-ai-agent

# Apply Kubernetes manifests
kubectl apply -f k8s-deployment.yaml

# Check deployment status
kubectl get pods -n teams-ai-agent
kubectl get services -n teams-ai-agent
```

## Teams App Configuration

### 1. Update Manifest
```json
{
  "id": "your-azure-ad-app-id",
  "packageName": "com.yourcompany.teams-ai-agent",
  "developer": {
    "name": "Your Company",
    "websiteUrl": "https://your-domain.com",
    "privacyUrl": "https://your-domain.com/privacy",
    "termsOfUseUrl": "https://your-domain.com/terms"
  },
  "validDomains": [
    "your-domain.com"
  ]
}
```

### 2. Create App Package
```bash
# Create app package
mkdir teams-app-package
cp teams-app-manifest.json teams-app-package/
cp color.png teams-app-package/
cp outline.png teams-app-package/

# Create zip package
cd teams-app-package
zip -r ../teams-ai-agent-app.zip .
cd ..
```

### 3. Upload to Teams
1. Go to Teams Admin Center
2. Navigate to Teams apps → Manage apps
3. Click "Upload" → "Upload a custom app"
4. Select your app package
5. Configure permissions and policies
6. Publish the app

## Monitoring and Maintenance

### Health Checks
```bash
# Check application health
curl -f http://your-domain.com/health

# Check specific endpoints
curl -f http://your-domain.com/api/auth/context
curl -f http://your-domain.com/api/mcp/tools
```

### Log Monitoring
```bash
# Azure App Service logs
az webapp log tail --resource-group $RESOURCE_GROUP --name $APP_NAME

# Docker logs
docker-compose logs -f

# Kubernetes logs
kubectl logs -f deployment/teams-ai-agent -n teams-ai-agent
```

### Performance Monitoring
- **Azure Application Insights**: Automatic monitoring for Azure deployments
- **AWS CloudWatch**: Monitoring for AWS deployments
- **Custom Metrics**: Application-specific metrics and alerts

## Troubleshooting

### Common Issues

#### Authentication Issues
```bash
# Check Azure AD configuration
az ad app show --id $AZURE_CLIENT_ID

# Verify token validation
curl -H "Authorization: Bearer $TOKEN" \
  http://your-domain.com/api/auth/user
```

#### AWS Bedrock Issues
```bash
# Check Bedrock access
aws bedrock list-foundation-models --region us-east-1

# Test model invocation
aws bedrock invoke-model \
  --model-id anthropic.claude-3-sonnet-20240229-v1:0 \
  --body '{"prompt":"Hello"}' \
  --region us-east-1
```

#### MCP Gateway Issues
```bash
# Test MCP Gateway connection
curl -H "Authorization: Bearer $MCP_API_KEY" \
  https://mcp.topcoder.com/health

# Check available tools
curl -H "Authorization: Bearer $MCP_API_KEY" \
  https://mcp.topcoder.com/tools
```

### Debug Mode
```bash
# Enable debug logging
export DEBUG=teams-ai-agent:*
export NODE_ENV=development

# Start with debug logging
npm run dev
```

## Security Considerations

### SSL/TLS Configuration
- Use HTTPS for all communications
- Configure proper SSL certificates
- Enable HSTS headers
- Use secure cookie settings

### Network Security
- Configure firewall rules
- Use VPC for AWS deployments
- Implement network segmentation
- Enable DDoS protection

### Application Security
- Regular security updates
- Vulnerability scanning
- Penetration testing
- Security monitoring

## Backup and Recovery

### Data Backup
```bash
# Backup configuration
cp .env backup/env-$(date +%Y%m%d).env

# Backup logs
tar -czf backup/logs-$(date +%Y%m%d).tar.gz logs/

# Backup application data
# (Implement based on your data storage solution)
```

### Disaster Recovery
- Multi-region deployment
- Automated backups
- Recovery procedures
- Testing procedures

## Scaling Considerations

### Horizontal Scaling
- Load balancer configuration
- Auto-scaling policies
- Database connection pooling
- Session management

### Vertical Scaling
- Resource monitoring
- Performance optimization
- Memory management
- CPU optimization

## Cost Optimization

### Azure Cost Optimization
- Use appropriate App Service tiers
- Implement auto-scaling
- Monitor resource usage
- Use reserved instances

### AWS Cost Optimization
- Use Spot instances for non-critical workloads
- Implement auto-scaling
- Monitor CloudWatch costs
- Use S3 for static assets

## Support and Maintenance

### Regular Maintenance
- Security updates
- Dependency updates
- Performance monitoring
- Log rotation

### Monitoring Setup
- Health check endpoints
- Alert configuration
- Log aggregation
- Performance metrics

### Documentation Updates
- Keep deployment docs current
- Update troubleshooting guides
- Maintain runbooks
- Document changes
