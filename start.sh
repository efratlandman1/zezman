#!/bin/bash

# Zezman Business Directory Application Startup Script

echo "🚀 Starting Zezman Business Directory Application..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed. Please install MongoDB or use Docker."
    echo "   You can start MongoDB with Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest"
fi

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use. Please stop the service using port $1."
        return 1
    fi
    return 0
}

# Check if ports are available
echo "🔍 Checking port availability..."
if ! check_port 3000; then
    echo "❌ Port 3000 (client) is already in use."
    exit 1
fi

if ! check_port 5000; then
    echo "❌ Port 5000 (server) is already in use."
    exit 1
fi

# Check if environment files exist
if [ ! -f "server/.env" ]; then
    echo "📝 Creating server environment file..."
    cp server/env.example server/.env
    echo "✅ Server .env file created. Please edit server/.env with your configuration."
fi

if [ ! -f "client/.env" ]; then
    echo "📝 Creating client environment file..."
    cp client/env.example client/.env
    echo "✅ Client .env file created. Please edit client/.env with your configuration."
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    cd server
    npm install
    cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 Installing client dependencies..."
    cd client
    npm install
    cd ..
fi

# Start the application
echo "🎯 Starting the application..."

# Start server in background
echo "🔧 Starting server on http://localhost:5000..."
cd server
npm start &
SERVER_PID=$!
cd ..

# Wait a moment for server to start
sleep 3

# Start client
echo "🎨 Starting client on http://localhost:3000..."
cd client
npm start &
CLIENT_PID=$!
cd ..

echo "✅ Application started successfully!"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo "   API Documentation: http://localhost:5000/api/v1/docs"
echo ""
echo "📝 To stop the application, press Ctrl+C"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping application..."
    kill $SERVER_PID 2>/dev/null
    kill $CLIENT_PID 2>/dev/null
    echo "✅ Application stopped."
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for background processes
wait 