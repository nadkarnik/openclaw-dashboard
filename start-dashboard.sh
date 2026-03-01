#!/bin/bash
# Start the OpenClaw Dashboard server

cd "$(dirname "$0")"

# Check if already running
if lsof -i :3456 > /dev/null 2>&1; then
    echo "✅ Dashboard is already running on http://localhost:3456"
    echo "   From this machine: http://localhost:3456"
    echo "   From network: http://$(hostname -I | awk '{print $1}'):3456"
    exit 0
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🚀 Starting OpenClaw Dashboard..."
echo "   Access at: http://localhost:3456"
echo "   From network: http://$(hostname -I | awk '{print $1}'):3456"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm start
