#!/bin/bash

echo "========================================"
echo "  Starting Auth Service"
echo "========================================"
echo ""

cd services/auth-service

if [ ! -f package.json ]; then
    echo "ERROR: package.json not found!"
    echo "Make sure you are running this from the project root."
    exit 1
fi

echo "Current directory: $(pwd)"
echo ""

if [ ! -d node_modules ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

echo "Starting auth service..."
echo ""
npm start
