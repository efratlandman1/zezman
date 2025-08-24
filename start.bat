@echo off
chcp 65001 >nul

echo 🚀 Starting Zezman Business Directory Application...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js v16 or higher.
    pause
    exit /b 1
)

REM Check if environment files exist
if not exist "server\.env" (
    echo 📝 Creating server environment file...
    copy "server\env.example" "server\.env" >nul
    echo ✅ Server .env file created. Please edit server\.env with your configuration.
)

if not exist "client\.env" (
    echo 📝 Creating client environment file...
    copy "client\env.example" "client\.env" >nul
    echo ✅ Client .env file created. Please edit client\.env with your configuration.
)

REM Install dependencies if node_modules doesn't exist
if not exist "server\node_modules" (
    echo 📦 Installing server dependencies...
    cd server
    call npm install
    cd ..
)

if not exist "client\node_modules" (
    echo 📦 Installing client dependencies...
    cd client
    call npm install
    cd ..
)

echo 🎯 Starting the application...

REM Start server in background
echo 🔧 Starting server on http://localhost:5000...
cd server
start "Zezman Server" cmd /c "npm start"
cd ..

REM Wait a moment for server to start
timeout /t 3 /nobreak >nul

REM Start client
echo 🎨 Starting client on http://localhost:3000...
cd client
start "Zezman Client" cmd /c "npm start"
cd ..

echo ✅ Application started successfully!
echo.
echo 🌐 Access the application:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:5000
echo    API Documentation: http://localhost:5000/api/v1/docs
echo.
echo 📝 Close the command windows to stop the application
pause 