@echo off
REM Microsoft Teams AI Agent Setup Script for Windows
REM This script sets up the development environment for the Teams AI Agent app

echo 🚀 Setting up Microsoft Teams AI Agent...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

echo ✅ Node.js version:
node --version

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    exit /b 1
)

echo ✅ npm version:
npm --version

REM Install dependencies
echo 📦 Installing dependencies...
call npm run install:all

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file from template...
    copy env.example .env
    echo ⚠️  Please update .env with your configuration values
) else (
    echo ✅ .env file already exists
)

REM Create logs directory
if not exist logs mkdir logs

REM Create SSL directory for nginx
if not exist ssl mkdir ssl

REM Create deployment directories
if not exist deployment mkdir deployment
if not exist deployment\azure mkdir deployment\azure
if not exist deployment\aws mkdir deployment\aws
if not exist deployment\docker mkdir deployment\docker

echo ✅ Deployment directories created

REM Create health check script
echo @echo off > scripts\health-check.bat
echo REM Health check script for the Teams AI Agent >> scripts\health-check.bat
echo set HEALTH_URL=http://localhost:3001/health >> scripts\health-check.bat
echo set MAX_RETRIES=5 >> scripts\health-check.bat
echo set RETRY_COUNT=0 >> scripts\health-check.bat
echo. >> scripts\health-check.bat
echo :loop >> scripts\health-check.bat
echo if %%RETRY_COUNT%% geq %%MAX_RETRIES%% goto fail >> scripts\health-check.bat
echo curl -f %%HEALTH_URL%% >nul 2>&1 >> scripts\health-check.bat
echo if %%errorlevel%% equ 0 ( >> scripts\health-check.bat
echo     echo ✅ Health check passed >> scripts\health-check.bat
echo     exit /b 0 >> scripts\health-check.bat
echo ^) else ( >> scripts\health-check.bat
echo     echo ⏳ Health check failed, retrying... %%RETRY_COUNT%%/%%MAX_RETRIES%% >> scripts\health-check.bat
echo     timeout /t 5 /nobreak >nul >> scripts\health-check.bat
echo     set /a RETRY_COUNT+=1 >> scripts\health-check.bat
echo     goto loop >> scripts\health-check.bat
echo ^) >> scripts\health-check.bat
echo. >> scripts\health-check.bat
echo :fail >> scripts\health-check.bat
echo echo ❌ Health check failed after %%MAX_RETRIES%% retries >> scripts\health-check.bat
echo exit /b 1 >> scripts\health-check.bat

echo ✅ Health check script created

REM Create backup script
echo @echo off > scripts\backup.bat
echo REM Backup script for Teams AI Agent data >> scripts\backup.bat
echo set BACKUP_DIR=backups\%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2% >> scripts\backup.bat
echo mkdir %%BACKUP_DIR%% 2>nul >> scripts\backup.bat
echo. >> scripts\backup.bat
echo echo Creating backup in %%BACKUP_DIR%%... >> scripts\backup.bat
echo. >> scripts\backup.bat
echo REM Backup environment configuration >> scripts\backup.bat
echo if exist .env copy .env %%BACKUP_DIR%%\ >> scripts\backup.bat
echo. >> scripts\backup.bat
echo REM Backup logs >> scripts\backup.bat
echo if exist logs xcopy logs %%BACKUP_DIR%\logs\ /E /I /Q >> scripts\backup.bat
echo. >> scripts\backup.bat
echo echo ✅ Backup completed: %%BACKUP_DIR%% >> scripts\backup.bat

echo ✅ Backup script created

echo.
echo 🎉 Setup completed successfully!
echo.
echo Next steps:
echo 1. Update .env with your configuration values
echo 2. Configure Azure AD app registration
echo 3. Set up AWS Bedrock access
echo 4. Configure MCP Gateway connection
echo 5. Run 'npm run dev' to start development
echo.
echo For more information, see README.md

pause
