# Use Node.js Alpine image for building TypeScript
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Use a lightweight Python image for serving static files
FROM python:3.11-alpine

# Set working directory
WORKDIR /app

# Copy built files and static assets
COPY --from=builder /app/dist/ ./dist/
COPY index.html ./
COPY package.json ./

# Create a simple callback handler
RUN echo '<!DOCTYPE html>\n<html><head><title>OAuth Callback</title></head><body><script>window.location.href="/";</script></body></html>' > callback.html

# Create a simple Python server script that handles routing
RUN cat > server.py << 'EOF'
#!/usr/bin/env python3
import http.server
import socketserver
import os
from urllib.parse import urlparse

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
def do_GET(self):
parsed_path = urlparse(self.path)

# Handle callback route
if parsed_path.path == '/callback':
# Serve index.html for callback route (SPA behavior)
self.path = '/index.html'
elif parsed_path.path == '/':
self.path = '/index.html'
elif not os.path.exists('.' + parsed_path.path):
# For any other route that doesn't exist, serve index.html (SPA fallback)
self.path = '/index.html'

return super().do_GET()

def end_headers(self):
# Add CORS headers for development
self.send_header('Access-Control-Allow-Origin', '*')
self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
super().end_headers()

def do_OPTIONS(self):
self.send_response(200)
self.end_headers()

if __name__ == '__main__':
PORT = int(os.environ.get('PORT', 4040))

with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
print(f"Serving at http://localhost:{PORT}")
httpd.serve_forever()
EOF

# Make the server script executable
RUN chmod +x server.py

# Expose port
EXPOSE 4040

# Set environment variable for port
ENV PORT=4040

# Run the server
CMD ["python3", "server.py"]