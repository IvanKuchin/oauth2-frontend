# OAuth 2.0 Frontend Demo

A simple OAuth 2.0 implementation using plain TypeScript (no frameworks) for frontend authentication.

## Features

- **OAuth 2.0 Authorization Code Flow** with PKCE (Proof Key for Code Exchange)
- **Token Management** with localStorage persistence
- **API Client** for making authenticated requests
- **Clean UI** for testing different API endpoints
- **Docker Support** for easy deployment

## API Endpoints

The application expects the following backend endpoints:

- `GET /api/v1/oauth2/authorize` - OAuth authorization endpoint
- `POST /api/v1/oauth2/token` - Token exchange endpoint
- `GET /api/v1/public` - Public API endpoint (no authentication)
- `GET /api/v1/protected` - Protected API endpoint (requires authentication)
- `GET /api/v1/admin` - Admin API endpoint (requires authentication + admin role)

## Project Structure

```
oauth2-frontend/
├── .github/
│   └── copilot-instructions.md # GitHub Copilot instructions
├── deploy/
│   ├── Dockerfile              # Docker container configuration
│   └── docker-compose.yml      # Docker Compose for easy deployment
├── src/
│   ├── app.ts                  # Main application logic
│   ├── oauth2-client.ts        # OAuth 2.0 client implementation
│   └── api-client.ts           # API client for backend calls
├── dist/                       # Compiled JavaScript (generated)
├── .gitignore                  # Git ignore rules
├── index.html                  # Main HTML file
├── package.json                # Node.js dependencies
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

## Development Setup

### Prerequisites

- Node.js 18+ (for TypeScript compilation)
- Python 3.11+ (for development server)

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build TypeScript:**
   ```bash
   npm run build
   ```

3. **Start development server:**
   ```bash
   npm run serve
   ```

4. **For continuous development (watch mode):**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:4040`

### Docker Deployment

1. **Build and run with Docker:**
   ```bash
   docker build -f deploy/Dockerfile -t oauth2-frontend .
   docker run -p 4040:4040 oauth2-frontend
   ```

2. **Or use Docker Compose:**
   ```bash
   docker-compose -f deploy/docker-compose.yml up --build
   ```

The application will be available at `http://localhost:4040`

## OAuth 2.0 Flow

1. **Authorization Request**: User clicks "Login" → redirected to `/api/v1/oauth2/authorize`
2. **Authorization Response**: Backend redirects to `/callback` with authorization code
3. **Token Exchange**: Frontend exchanges code for access token via `/api/v1/oauth2/token`
4. **API Calls**: Use access token for authenticated requests

## Configuration

OAuth configuration is set in [`src/app.ts`](src/app.ts):

```typescript
const authConfig: AuthConfig = {
    clientId: 'demo-client-id',
    redirectUri: `${window.location.origin}/callback`,
    authorizationEndpoint: '/api/v1/oauth2/authorize',
    tokenEndpoint: '/api/v1/oauth2/token',
    scope: 'read write admin'
};
```

## Security Features

- **PKCE (Proof Key for Code Exchange)** for secure authorization
- **State parameter** to prevent CSRF attacks
- **Token validation** and expiration handling
- **Secure token storage** in localStorage
- **CORS support** for cross-origin requests

## API Testing

The UI provides buttons to test different API endpoints:

- **Public API**: No authentication required
- **Protected API**: Requires valid access token
- **Admin API**: Requires valid access token with admin permissions

## Browser Compatibility

- Modern browsers supporting ES2020
- Crypto API for PKCE implementation
- Fetch API for HTTP requests
- localStorage for token persistence

## Production Considerations

1. **HTTPS Only**: Always use HTTPS in production
2. **Secure Storage**: Consider more secure token storage options
3. **Token Refresh**: Implement refresh token logic for long sessions
4. **Error Handling**: Add comprehensive error handling
5. **Logging**: Add proper logging for debugging
6. **CSP Headers**: Implement Content Security Policy
7. **Environment Configuration**: Use environment variables for different deployments

## Backend Integration

This frontend expects a backend that implements:

1. **OAuth 2.0 Authorization Server**
2. **Resource Server** with the specified API endpoints
3. **CORS configuration** to allow frontend domain
4. **Token validation** for protected endpoints

Example backend response formats:

### Token Response (`/api/v1/oauth2/token`):
```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "refresh_token": "refresh_token_here",
    "scope": "read write"
}
```

### API Responses:
```json
{
    "data": "response_data",
    "message": "Success"
}
```

## License

MIT License - feel free to use this code in your projects.