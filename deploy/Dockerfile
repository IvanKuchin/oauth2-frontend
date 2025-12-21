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

# Use Nginx Alpine for serving static files
FROM nginx:alpine

# Copy built files and static assets
COPY --from=builder /app/dist/ /usr/share/nginx/html/dist/
COPY index.html /usr/share/nginx/html/

# Create Nginx configuration for SPA routing
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
listen 4040;
listen [::]:4040;
server_name localhost;
root /usr/share/nginx/html;
index index.html;

# Enable gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_proxied any;
gzip_comp_level 6;
gzip_types
text/plain
text/css
text/xml
text/javascript
application/javascript
application/xml+rss
application/json;

# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;

# CORS headers for API calls
add_header Access-Control-Allow-Origin "*" always;
add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
add_header Access-Control-Allow-Headers "Accept, Authorization, Cache-Control, Content-Type, DNT, If-Modified-Since, Keep-Alive, Origin, User-Agent, X-Requested-With" always;

# Handle preflight OPTIONS requests
location / {
if ($request_method = 'OPTIONS') {
add_header Access-Control-Allow-Origin "*" always;
add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
add_header Access-Control-Allow-Headers "Accept, Authorization, Cache-Control, Content-Type, DNT, If-Modified-Since, Keep-Alive, Origin, User-Agent, X-Requested-With" always;
add_header Access-Control-Max-Age 1728000;
add_header Content-Type "text/plain; charset=utf-8";
add_header Content-Length 0;
return 204;
}

try_files $uri $uri/ /index.html;
}

# Handle callback route (SPA routing)
location /callback {
try_files $uri $uri/ /index.html;
}

# Cache static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
expires 1y;
add_header Cache-Control "public, immutable";
}

# Security: Don't serve hidden files
location ~ /\. {
deny all;
}
}
EOF

# Expose port
EXPOSE 4040

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]