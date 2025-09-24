@echo off
REM Microsoft Teams AI Agent Deployment Script for Windows
REM This script handles deployment to different environments

setlocal enabledelayedexpansion

echo 🚀 Microsoft Teams AI Agent Deployment Script
echo ==============================================

REM Parse command line arguments
if "%1"=="" goto help
if "%1"=="help" goto help
if "%1"=="build" goto build
if "%1"=="package" goto package
if "%1"=="azure" goto azure
if "%1"=="aws" goto aws
if "%1"=="docker" goto docker
if "%1"=="all" goto all
goto help

:build
echo [INFO] Building the application...
call npm run install:all
cd client
call npm run build
cd ..
echo [SUCCESS] Application built successfully
goto end

:package
call :build
call :create_package
goto end

:azure
call :build
call :create_package
call :deploy_azure
goto end

:aws
call :build
call :create_package
call :deploy_aws
goto end

:docker
call :build
call :deploy_docker
goto end

:all
call :build
call :create_package
echo [INFO] Deployment package ready for manual deployment
goto end

:help
echo Usage: %0 {build^|package^|azure^|aws^|docker^|all^|help}
echo.
echo Commands:
echo   build      - Build the application
echo   package    - Build and create deployment package
echo   azure      - Deploy to Azure App Service
echo   aws        - Deploy to AWS ECS
echo   docker     - Deploy with Docker Compose
echo   all        - Build and package for manual deployment
echo   help       - Show this help message
echo.
echo Environment variables:
echo   AZURE_RESOURCE_GROUP - Azure resource group name
echo   AZURE_APP_NAME       - Azure app name
echo   AZURE_LOCATION       - Azure location
echo   AWS_CLUSTER_NAME     - AWS ECS cluster name
echo   AWS_SERVICE_NAME     - AWS ECS service name
echo   AWS_REGION           - AWS region
goto end

:create_package
echo [INFO] Creating deployment package...
if not exist deployment\package mkdir deployment\package

REM Copy server files
xcopy server deployment\package\server\ /E /I /Q
copy package*.json deployment\package\
if exist .env copy .env deployment\package\

REM Copy built React app
xcopy client\build deployment\package\public\ /E /I /Q

REM Copy configuration files
copy teams-app-manifest.json deployment\package\
copy docker-compose.yml deployment\package\
copy Dockerfile deployment\package\
copy nginx.conf deployment\package\

REM Create deployment zip
cd deployment\package
powershell Compress-Archive -Path * -DestinationPath ..\teams-ai-agent-deployment.zip -Force
cd ..\..

echo [SUCCESS] Deployment package created: deployment\teams-ai-agent-deployment.zip
goto :eof

:deploy_azure
echo [INFO] Deploying to Azure...
where az >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Azure CLI is not installed. Please install it first.
    exit /b 1
)

REM Check if logged in to Azure
az account show >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Not logged in to Azure. Please run 'az login' first.
    exit /b 1
)

REM Set environment variables
if "%AZURE_RESOURCE_GROUP%"=="" set AZURE_RESOURCE_GROUP=teams-ai-agent-rg
if "%AZURE_APP_NAME%"=="" set AZURE_APP_NAME=teams-ai-agent
if "%AZURE_LOCATION%"=="" set AZURE_LOCATION=eastus

echo [INFO] Using Azure configuration:
echo   Resource Group: %AZURE_RESOURCE_GROUP%
echo   App Name: %AZURE_APP_NAME%
echo   Location: %AZURE_LOCATION%

REM Create resource group
az group create --name %AZURE_RESOURCE_GROUP% --location %AZURE_LOCATION% >nul 2>&1

REM Create App Service plan
az appservice plan create --name %AZURE_APP_NAME%-plan --resource-group %AZURE_RESOURCE_GROUP% --sku B1 --is-linux >nul 2>&1

REM Create App Service
az webapp create --resource-group %AZURE_RESOURCE_GROUP% --plan %AZURE_APP_NAME%-plan --name %AZURE_APP_NAME% --runtime "NODE|18-lts" >nul 2>&1

REM Configure app settings
if exist .env (
    echo [INFO] Configuring app settings...
    az webapp config appsettings set --resource-group %AZURE_RESOURCE_GROUP% --name %AZURE_APP_NAME% --settings @.env
)

REM Deploy the app
echo [INFO] Deploying application...
az webapp deployment source config-zip --resource-group %AZURE_RESOURCE_GROUP% --name %AZURE_APP_NAME% --src deployment\teams-ai-agent-deployment.zip

echo [SUCCESS] Deployed to Azure App Service: https://%AZURE_APP_NAME%.azurewebsites.net
goto :eof

:deploy_aws
echo [INFO] Deploying to AWS...
where aws >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] AWS CLI is not installed. Please install it first.
    exit /b 1
)

REM Check if logged in to AWS
aws sts get-caller-identity >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Not logged in to AWS. Please run 'aws configure' first.
    exit /b 1
)

echo [WARNING] AWS ECS deployment requires additional configuration
echo [INFO] Please refer to the documentation for complete AWS deployment steps
goto :eof

:deploy_docker
echo [INFO] Deploying with Docker Compose...
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install it first.
    exit /b 1
)

where docker-compose >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed. Please install it first.
    exit /b 1
)

REM Build and start services
docker-compose up -d --build

echo [SUCCESS] Deployed with Docker Compose
echo [INFO] Application is running at http://localhost
goto :eof

:end
echo.
echo Deployment completed!
pause
