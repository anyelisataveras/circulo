#!/bin/bash

# Circulo - Grant Management System
# Deployment Script for VPS

set -e  # Exit on error

echo "========================================="
echo "Circulo Deployment Script"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please create .env file with required environment variables."
    echo "See ENV_CONFIGURATION.md for details."
    exit 1
fi

echo -e "${GREEN}✓${NC} Found .env file"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed!${NC}"
    echo "Please install Node.js 22 or higher."
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js $(node --version) found"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠${NC} pnpm not found. Installing..."
    npm install -g pnpm
fi

echo -e "${GREEN}✓${NC} pnpm $(pnpm --version) found"

# Install dependencies
echo ""
echo "Installing dependencies..."
pnpm install --frozen-lockfile

echo -e "${GREEN}✓${NC} Dependencies installed"

# Push database schema
echo ""
echo "Setting up database..."
pnpm db:push

echo -e "${GREEN}✓${NC} Database schema pushed"

# Build application
echo ""
echo "Building application..."
NODE_OPTIONS="--max-old-space-size=4096" pnpm build

echo -e "${GREEN}✓${NC} Application built successfully"

# Check if PM2 is installed
if command -v pm2 &> /dev/null; then
    echo ""
    echo "Restarting application with PM2..."
    pm2 restart circulo || pm2 start npm --name "circulo" -- start
    pm2 save
    echo -e "${GREEN}✓${NC} Application restarted with PM2"
else
    echo ""
    echo -e "${YELLOW}⚠${NC} PM2 not found. Install PM2 for process management:"
    echo "  npm install -g pm2"
    echo "  pm2 start npm --name 'circulo' -- start"
    echo ""
    echo "Or start manually with:"
    echo "  pnpm start"
fi

echo ""
echo "========================================="
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. If using PM2: pm2 logs circulo"
echo "2. If manual: pnpm start"
echo "3. Access your application at http://your-server-ip:3000"
echo ""
