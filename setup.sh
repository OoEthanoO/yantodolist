#!/bin/bash

# YanToDoList Setup Script
# This script helps set up the development environment

echo "🚀 YanToDoList Setup Script"
echo "============================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your database credentials and secrets"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo ""

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate
echo ""

# Ask about database setup
echo "🗄️  Database Setup"
read -p "Do you want to run database migrations now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running migrations..."
    npx prisma migrate dev --name init
    echo ""
fi

# Generate NextAuth secret if needed
if ! grep -q "NEXTAUTH_SECRET=" .env || grep -q "NEXTAUTH_SECRET=\"your-secret-key-here\"" .env; then
    echo "🔐 Generating NEXTAUTH_SECRET..."
    SECRET=$(openssl rand -base64 32)
    
    # Update .env file
    if grep -q "NEXTAUTH_SECRET=" .env; then
        # Replace existing line
        sed -i.bak "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$SECRET\"|" .env && rm .env.bak
    else
        # Add new line
        echo "NEXTAUTH_SECRET=\"$SECRET\"" >> .env
    fi
    echo "✅ NEXTAUTH_SECRET generated and added to .env"
    echo ""
fi

echo "✨ Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Edit .env file and add your DATABASE_URL"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:3000"
echo ""
echo "📚 For deployment instructions, see DEPLOYMENT.md"
echo ""
