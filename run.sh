#!/bin/bash

# WinterSim - Winter Sports Simulation App
# Run script for local development

echo "=========================================="
echo "   WinterSim - Winter Sports Simulation"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

echo -e "${BLUE}Node.js version:${NC} $(node -v)"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Kill any existing processes on our ports
echo -e "${BLUE}Checking for existing processes...${NC}"
lsof -ti:3005 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Install backend dependencies
echo -e "${BLUE}Installing backend dependencies...${NC}"
cd "$SCRIPT_DIR/backend"
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "Backend dependencies already installed."
fi

# Create data directory if it doesn't exist
mkdir -p "$SCRIPT_DIR/backend/data"

# Install frontend dependencies
echo -e "${BLUE}Installing frontend dependencies...${NC}"
cd "$SCRIPT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "Frontend dependencies already installed."
fi

echo ""
echo -e "${GREEN}Starting WinterSim...${NC}"
echo ""

# Function to cleanup background processes
cleanup() {
    echo ""
    echo -e "${BLUE}Shutting down WinterSim...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${BLUE}Starting backend server...${NC}"
cd "$SCRIPT_DIR/backend"
npm run dev &
BACKEND_PID=$!

# Wait for backend to be ready
echo -e "${BLUE}Waiting for backend to start...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3005/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}Backend is ready!${NC}"
        break
    fi
    sleep 1
done

# Start frontend
echo -e "${BLUE}Starting frontend dev server...${NC}"
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 3

echo ""
echo "=========================================="
echo -e "${GREEN}WinterSim is running!${NC}"
echo ""
echo -e "Backend API:  ${BLUE}http://localhost:3005${NC}"
echo -e "Frontend:     ${BLUE}http://localhost:5173${NC}"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "=========================================="

# Wait for both processes
wait
