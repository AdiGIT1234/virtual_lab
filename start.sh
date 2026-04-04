#!/bin/bash

# Master Start Script for Virtual Lab
# This script launches both the Vite React Frontend and the FastAPI Backend locally.

echo "======================================"
echo "    Starting Virtual Lab System       "
echo "======================================"

# Function to handle cleanup on script exit
cleanup() {
    echo ""
    echo "Stopping all services..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit 0
}

# Trap SIGINT and SIGTERM to run cleanup
trap cleanup SIGINT SIGTERM

echo "-> Starting FastAPI Backend on port 8000..."
cd backend
# Check if virtual environment exists and activate it
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d "env" ]; then
    source env/bin/activate
else
    echo "Warning: No virtual environment found in backend/ directory. Using global python..."
fi

uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

echo "-> Starting React/Vite Frontend on port 5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "======================================"
echo "  Backend Running: http://127.0.0.1:8000"
echo "  Frontend Running: http://localhost:5173"
echo "  Press Ctrl+C to terminate both servers"
echo "======================================"
echo ""

# Keep script running to maintain processes
wait 
