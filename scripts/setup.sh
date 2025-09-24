#!/bin/bash

# Microsoft Teams AI Agent Setup Script
# This script sets up the development environment for the Teams AI Agent app

set -e

echo "🚀 Setting up Microsoft Teams AI Agent..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please update .env with your configuration values"
else
    echo "✅ .env file already exists"
fi

# Create logs directory
mkdir -p logs

# Create SSL directory for nginx
mkdir -p ssl

# Set up git hooks
echo "🔧 Setting up git hooks..."
if [ -d .git ]; then
    # Add pre-commit hook for linting
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "Running pre-commit checks..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Linting failed. Please fix the issues before committing."
    exit 1
fi
echo "✅ Pre-commit checks passed"
EOF
    chmod +x .git/hooks/pre-commit
    echo "✅ Git hooks configured"
fi

# Create deployment directories
mkdir -p deployment/{azure,aws,docker}

# Copy deployment configurations
echo "📋 Setting up deployment configurations..."

# Azure deployment
cat > deployment/azure/deploy.sh << 'EOF'
#!/bin/bash
# Azure App Service deployment script
echo "Deploying to Azure App Service..."
az webapp deployment source config-zip --resource-group $RESOURCE_GROUP --name $APP_NAME --src ../deployment.zip
EOF
chmod +x deployment/azure/deploy.sh

# AWS deployment
cat > deployment/aws/deploy.sh << 'EOF'
#!/bin/bash
# AWS ECS deployment script
echo "Deploying to AWS ECS..."
aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --force-new-deployment
EOF
chmod +x deployment/aws/deploy.sh

# Docker deployment
cat > deployment/docker/deploy.sh << 'EOF'
#!/bin/bash
# Docker Compose deployment script
echo "Deploying with Docker Compose..."
docker-compose up -d --build
EOF
chmod +x deployment/docker/deploy.sh

echo "✅ Deployment scripts created"

# Create health check script
cat > scripts/health-check.sh << 'EOF'
#!/bin/bash
# Health check script for the Teams AI Agent
HEALTH_URL="http://localhost:3001/health"
MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f $HEALTH_URL > /dev/null 2>&1; then
        echo "✅ Health check passed"
        exit 0
    else
        echo "⏳ Health check failed, retrying... ($((RETRY_COUNT + 1))/$MAX_RETRIES)"
        sleep 5
        RETRY_COUNT=$((RETRY_COUNT + 1))
    fi
done

echo "❌ Health check failed after $MAX_RETRIES retries"
exit 1
EOF
chmod +x scripts/health-check.sh

# Create backup script
cat > scripts/backup.sh << 'EOF'
#!/bin/bash
# Backup script for Teams AI Agent data
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

echo "Creating backup in $BACKUP_DIR..."

# Backup environment configuration
cp .env $BACKUP_DIR/ 2>/dev/null || echo "No .env file to backup"

# Backup logs
cp -r logs $BACKUP_DIR/ 2>/dev/null || echo "No logs to backup"

# Backup database (if using local database)
# cp -r data $BACKUP_DIR/ 2>/dev/null || echo "No data to backup"

echo "✅ Backup completed: $BACKUP_DIR"
EOF
chmod +x scripts/backup.sh

# Create monitoring script
cat > scripts/monitor.sh << 'EOF'
#!/bin/bash
# Monitoring script for Teams AI Agent
echo "🔍 Monitoring Teams AI Agent..."

# Check if the service is running
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Service is running"
else
    echo "❌ Service is not responding"
    exit 1
fi

# Check memory usage
MEMORY_USAGE=$(ps aux | grep node | grep -v grep | awk '{sum+=$6} END {print sum/1024 " MB"}')
echo "📊 Memory usage: $MEMORY_USAGE"

# Check disk usage
DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}')
echo "💾 Disk usage: $DISK_USAGE"

# Check log file sizes
if [ -d logs ]; then
    LOG_SIZE=$(du -sh logs | cut -f1)
    echo "📝 Log size: $LOG_SIZE"
fi

echo "✅ Monitoring completed"
EOF
chmod +x scripts/monitor.sh

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update .env with your configuration values"
echo "2. Configure Azure AD app registration"
echo "3. Set up AWS Bedrock access"
echo "4. Configure MCP Gateway connection"
echo "5. Run 'npm run dev' to start development"
echo ""
echo "For more information, see README.md"
