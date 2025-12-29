import { OAuth2Client, AuthConfig } from './oauth2-client.js';
import { ApiClient, ApiResponse } from './api-client.js';

class OAuth2App {
    private oauth2Client: OAuth2Client;
    private apiClient: ApiClient;

    // DOM elements
    private authStatus!: HTMLElement;
    private loginBtn!: HTMLButtonElement;
    private logoutBtn!: HTMLButtonElement;
    private tokenInfo!: HTMLElement;
    private idTokenInfo!: HTMLElement;
    private tokenInfoSection!: HTMLElement;
    private idTokenInfoSection!: HTMLElement;
    private publicApiBtn!: HTMLButtonElement;
    private protectedApiBtn!: HTMLButtonElement;
    private adminApiBtn!: HTMLButtonElement;
    private publicResponse!: HTMLElement;
    private protectedResponse!: HTMLElement;
    private adminResponse!: HTMLElement;

    constructor() {
        let baseUrl = window.location.hostname.includes("localhost") ? "http://localhost:8080" : "https://production-url.com";

        // OAuth 2.0 configuration
        const authConfig: AuthConfig = {
            clientId: 'demo-client-id',
            redirectUri: `${window.location.origin}/callback`,
            baseUrl: baseUrl,
            authorizationEndpoint: '/api/v1/oauth2/authorize',
            tokenEndpoint: '/api/v1/oauth2/token',
            scope: 'read write admin'
        };

        this.oauth2Client = new OAuth2Client(authConfig);
        this.apiClient = new ApiClient(baseUrl);
        this.initializeDOM();
        this.setupEventListeners();
        this.handleInitialLoad().catch(error => {
            console.error('Failed to handle initial load:', error);
            this.showMessage(`Initialization failed: ${error}`, 'error');
        });

        this.showMessage('App initialized', 'success');
    }

    /**
     * Initialize DOM element references
     */
    private initializeDOM(): void {
        this.authStatus = document.getElementById('authStatus')!;
        this.loginBtn = document.getElementById('loginBtn') as HTMLButtonElement;
        this.logoutBtn = document.getElementById('logoutBtn') as HTMLButtonElement;
        this.tokenInfo = document.getElementById('tokenInfo')!;
        this.tokenInfoSection = document.getElementById('tokenInfoSection')!;
        this.idTokenInfo = document.getElementById('idTokenInfo')!;
        this.idTokenInfoSection = document.getElementById('idTokenInfoSection')!;
        this.publicApiBtn = document.getElementById('publicApiBtn') as HTMLButtonElement;
        this.protectedApiBtn = document.getElementById('protectedApiBtn') as HTMLButtonElement;
        this.adminApiBtn = document.getElementById('adminApiBtn') as HTMLButtonElement;
        this.publicResponse = document.getElementById('publicResponse')!;
        this.protectedResponse = document.getElementById('protectedResponse')!;
        this.adminResponse = document.getElementById('adminResponse')!;
    }

    /**
     * Setup event listeners for all interactive elements
     */
    private setupEventListeners(): void {
        this.loginBtn.addEventListener('click', () => this.handleLogin());
        this.logoutBtn.addEventListener('click', () => this.handleLogout());
        this.publicApiBtn.addEventListener('click', () => this.handlePublicApiCall());
        this.protectedApiBtn.addEventListener('click', () => this.handleProtectedApiCall());
        this.adminApiBtn.addEventListener('click', () => this.handleAdminApiCall());
    }

    /**
     * Handle initial page load - check for callback or update UI
     */
    private async handleInitialLoad(): Promise<void> {
        // Check if we're returning from OAuth callback
        if (window.location.pathname === '/callback' && window.location.search.includes('code=')) {
            try {
                await this.oauth2Client.handleCallback();
                this.showMessage('Authentication successful!', 'success');
                // Redirect to main page after successful auth
                window.history.replaceState({}, document.title, '/');
            } catch (error) {
                this.showMessage(`Authentication failed: ${error}`, 'error');
                window.history.replaceState({}, document.title, '/');
            }
        }

        this.updateUI();
    }

    /**
     * Update UI based on authentication state
     */
    private updateUI(): void {
        this.updateAccessTokenUI();
        this.updateIdTokenUI();
    }

    /**
     * Update UI with access token information
     */
    private updateAccessTokenUI(): void {
        const isAuthenticated = this.oauth2Client.isAuthenticated();
        const accessToken = this.oauth2Client.getAccessToken();

        // Update authentication status
        if (isAuthenticated) {
            this.authStatus.textContent = 'Authenticated';
            this.authStatus.className = 'status authenticated';
            this.loginBtn.style.display = 'none';
            this.logoutBtn.style.display = 'inline-block';

            // Show token info
            const tokenInfo = this.oauth2Client.getTokenInfo();
            if (tokenInfo) {
                this.tokenInfo.textContent = JSON.stringify(tokenInfo, null, 2);
                this.tokenInfoSection.style.display = 'block';
            }
        } else {
            this.authStatus.textContent = 'Not Authenticated';
            this.authStatus.className = 'status not-authenticated';
            this.loginBtn.style.display = 'inline-block';
            this.logoutBtn.style.display = 'none';
            this.tokenInfoSection.style.display = 'none';
        }

        // Update API client with token
        this.apiClient.setAccessToken(accessToken);

        // Enable/disable protected API buttons
        this.protectedApiBtn.disabled = !isAuthenticated;
        this.adminApiBtn.disabled = !isAuthenticated;
    }

    /**
     * Update UI with identity token information
     */
    private updateIdTokenUI(): void {
        const isAuthenticated = this.oauth2Client.isAuthenticated();

        if (isAuthenticated) {
            const idToken = this.oauth2Client.getIdToken();
            if (idToken) {
                // console.log('ID Token:', idToken);
                this.idTokenInfo.textContent = JSON.stringify(idToken, null, 2);
                this.idTokenInfoSection.style.display = 'block';
            } else {
                this.idTokenInfoSection.style.display = 'none';
            }
        } else {
            this.idTokenInfoSection.style.display = 'none';
        }
    }

    /**
     * Handle login button click
     */
    private async handleLogin(): Promise<void> {
        try {
            await this.oauth2Client.authorize();
        } catch (error) {
            this.showMessage(`Login failed: ${error}`, 'error');
        }
    }

    /**
     * Handle logout button click
     */
    private handleLogout(): void {
        this.oauth2Client.logout();
        this.updateUI();
        this.clearApiResponses();
        this.showMessage('Logged out successfully', 'success');
    }

    /**
     * Handle public API call
     */
    private async handlePublicApiCall(): Promise<void> {
        this.publicApiBtn.disabled = true;
        this.publicApiBtn.textContent = 'Calling...';

        try {
            const response = await this.apiClient.callPublicApi();
            this.displayApiResponse(this.publicResponse, response);
        } catch (error) {
            this.displayApiResponse(this.publicResponse, {
                error: error instanceof Error ? error.message : 'Unknown error',
                status: 0,
                message: 'Request failed'
            });
        } finally {
            this.publicApiBtn.disabled = false;
            this.publicApiBtn.textContent = 'Call /api/v1/public';
        }
    }

    /**
     * Handle protected API call
     */
    private async handleProtectedApiCall(): Promise<void> {
        this.protectedApiBtn.disabled = true;
        this.protectedApiBtn.textContent = 'Calling...';

        try {
            const response = await this.apiClient.callProtectedApi();
            this.displayApiResponse(this.protectedResponse, response);
        } catch (error) {
            this.displayApiResponse(this.protectedResponse, {
                error: error instanceof Error ? error.message : 'Unknown error',
                status: 0,
                message: 'Request failed'
            });
        } finally {
            this.protectedApiBtn.disabled = !this.oauth2Client.isAuthenticated();
            this.protectedApiBtn.textContent = 'Call /api/v1/protected';
        }
    }

    /**
     * Handle admin API call
     */
    private async handleAdminApiCall(): Promise<void> {
        this.adminApiBtn.disabled = true;
        this.adminApiBtn.textContent = 'Calling...';

        try {
            const response = await this.apiClient.callAdminApi();
            this.displayApiResponse(this.adminResponse, response);
        } catch (error) {
            this.displayApiResponse(this.adminResponse, {
                error: error instanceof Error ? error.message : 'Unknown error',
                status: 0,
                message: 'Request failed'
            });
        } finally {
            this.adminApiBtn.disabled = !this.oauth2Client.isAuthenticated();
            this.adminApiBtn.textContent = 'Call /api/v1/admin';
        }
    }

    /**
     * Display API response in the UI
     */
    private displayApiResponse(element: HTMLElement, response: ApiResponse): void {
        const isSuccess = response.status >= 200 && response.status < 300;

        element.className = `response ${isSuccess ? 'success' : 'error'}`;
        element.style.display = 'block';

        const displayData = {
            status: response.status,
            message: response.message,
            ...(response.data && { data: response.data }),
            ...(response.error && { error: response.error })
        };

        element.textContent = JSON.stringify(displayData, null, 2);
    }

    /**
     * Show a temporary message to the user
     */
    private showMessage(message: string, type: 'success' | 'error'): void {
        // Create a temporary message element
        const messageElement = document.createElement('div');
        messageElement.className = `response ${type}`;
        messageElement.textContent = message;
        messageElement.style.position = 'fixed';
        messageElement.style.top = '20px';
        messageElement.style.right = '20px';
        messageElement.style.zIndex = '1000';
        messageElement.style.maxWidth = '300px';

        document.body.appendChild(messageElement);

        // Remove after 3 seconds
        setTimeout(() => {
            if (document.body.contains(messageElement)) {
                document.body.removeChild(messageElement);
            }
        }, 3000);
    }

    /**
     * Clear all API response displays
     */
    private clearApiResponses(): void {
        this.publicResponse.style.display = 'none';
        this.protectedResponse.style.display = 'none';
        this.adminResponse.style.display = 'none';
    }
}


// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => new OAuth2App());