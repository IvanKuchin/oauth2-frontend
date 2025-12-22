export interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
}

export interface AuthConfig {
    clientId: string;
    redirectUri: string;
    authorizationEndpoint: string;
    tokenEndpoint: string;
    scope?: string;
}

export class OAuth2Client {
    private config: AuthConfig;
    private accessToken: string | null = null;
    private refreshToken: string | null = null;

    constructor(config: AuthConfig) {
        this.config = config;
        this.loadTokensFromStorage();
    }

    /**
     * Generate a random string for PKCE code verifier and state
     */
    private generateRandomString(length: number): string {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        let result = Array.from(array, byte => (byte.toString(16)).padStart(2, '_')).join('');
        return result.slice(0, length);
    }

    /**
     * Generate SHA256 hash for PKCE code challenge
     */
    private async generateCodeChallenge(codeVerifier: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(codeVerifier);
        const digest = await crypto.subtle.digest('SHA-256', data);

        // Convert to base64url
        return btoa(String.fromCharCode(...new Uint8Array(digest)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    /**
     * Initiate the OAuth 2.0 authorization flow
     */
    async authorize(): Promise<void> {
        const state = this.generateRandomString(32);
        const codeVerifier = this.generateRandomString(128);
        const codeChallenge = await this.generateCodeChallenge(codeVerifier);

        // Store state and code verifier for later verification
        sessionStorage.setItem('oauth_state', state);
        sessionStorage.setItem('oauth_code_verifier', codeVerifier);

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            state: state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            scope: this.config.scope || 'read'
        });

        const authUrl = `${this.config.authorizationEndpoint}?${params.toString()}`;
        window.location.href = authUrl;
    }

    /**
     * Handle the callback from the authorization server
     */
    async handleCallback(): Promise<boolean> {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
            console.error('OAuth error:', error);
            throw new Error(`OAuth error: ${error}`);
        }

        if (!code || !state) {
            throw new Error('Missing authorization code or state parameter');
        }

        const storedState = sessionStorage.getItem('oauth_state');
        if (state !== storedState) {
            throw new Error('Invalid state parameter');
        }

        const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
        if (!codeVerifier) {
            throw new Error('Missing code verifier');
        }

        // Clean up session storage
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_code_verifier');

        // Exchange code for token
        return await this.exchangeCodeForToken(code, codeVerifier);
    }

    /**
     * Exchange authorization code for access token
     */
    private async exchangeCodeForToken(code: string, codeVerifier: string): Promise<boolean> {
        const body = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: this.config.redirectUri,
            client_id: this.config.clientId,
            code_verifier: codeVerifier
        });

        try {
            const response = await fetch(this.config.tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: body.toString()
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
            }

            const tokenResponse: TokenResponse = await response.json();

            this.accessToken = tokenResponse.access_token;
            this.refreshToken = tokenResponse.refresh_token || null;

            // Store tokens in localStorage for persistence
            this.saveTokensToStorage(tokenResponse);

            return true;
        } catch (error) {
            console.error('Token exchange error:', error);
            throw error;
        }
    }

    /**
     * Save tokens to localStorage
     */
    private saveTokensToStorage(tokenResponse: TokenResponse): void {
        localStorage.setItem('access_token', tokenResponse.access_token);
        if (tokenResponse.refresh_token) {
            localStorage.setItem('refresh_token', tokenResponse.refresh_token);
        }
        if (tokenResponse.expires_in) {
            const expiresAt = Date.now() + (tokenResponse.expires_in * 1000);
            localStorage.setItem('token_expires_at', expiresAt.toString());
        }
    }

    /**
     * Load tokens from localStorage
     */
    private loadTokensFromStorage(): void {
        this.accessToken = localStorage.getItem('access_token');
        this.refreshToken = localStorage.getItem('refresh_token');

        // Check if token is expired
        const expiresAt = localStorage.getItem('token_expires_at');
        if (expiresAt && Date.now() > parseInt(expiresAt)) {
            this.logout();
        }
    }

    /**
     * Get the current access token
     */
    getAccessToken(): string | null {
        return this.accessToken;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return this.accessToken !== null;
    }

    /**
     * Get token info for display
     */
    getTokenInfo(): any {
        if (!this.accessToken) return null;

        try {
            // Decode JWT token (just for display purposes)
            const payload = this.accessToken.split('.')[1];
            if (payload) {
                const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
                return {
                    token: this.accessToken.substring(0, 20) + '...',
                    expires: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'Unknown',
                    scope: decoded.scope || 'Unknown',
                    user: decoded.sub || decoded.username || 'Unknown'
                };
            }
        } catch (error) {
            // If not a JWT token, just return basic info
            return {
                token: this.accessToken.substring(0, 20) + '...',
                type: 'Bearer'
            };
        }

        return null;
    }

    /**
     * Logout and clear tokens
     */
    logout(): void {
        this.accessToken = null;
        this.refreshToken = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token_expires_at');

        // Clear the URL if we're on callback page
        if (window.location.pathname === '/callback') {
            window.history.replaceState({}, document.title, '/');
        }
    }
}