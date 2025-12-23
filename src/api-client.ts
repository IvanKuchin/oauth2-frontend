export interface ApiResponse {
    data?: any;
    error?: string;
    status: number;
    message?: string;
}

export class ApiClient {
    private baseUrl: string;
    private accessToken: string | null = null;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    /**
     * Set the access token for authenticated requests
     */
    setAccessToken(token: string | null): void {
        this.accessToken = token;
    }

    /**
     * Make a generic API request
     */
    private async makeRequest(
        url: string,
        options: RequestInit = {},
        requiresAuth: boolean = false
    ): Promise<ApiResponse> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (requiresAuth && this.accessToken) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
        }

        try {
            const response = await fetch(`${this.baseUrl}${url}`, {
                ...options,
                headers
            });

            let data: any = null;
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            return {
                data,
                status: response.status,
                message: response.statusText
            };
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Network error',
                status: 503,
                message: 'Service unavailable (network error)'
            };
        }
    }

    /**
     * Make a public API call (no authentication required)
     */
    async callPublicApi(): Promise<ApiResponse> {
        return await this.makeRequest('/api/v1/public', {
            method: 'GET'
        }, false);
    }

    /**
     * Make a protected API call (authentication required)
     */
    async callProtectedApi(): Promise<ApiResponse> {
        if (!this.accessToken) {
            return {
                error: 'No access token available',
                status: 401,
                message: 'Authentication required'
            };
        }

        return await this.makeRequest('/api/v1/protected', {
            method: 'GET'
        }, true);
    }

    /**
     * Make an admin API call (authentication and admin role required)
     */
    async callAdminApi(): Promise<ApiResponse> {
        if (!this.accessToken) {
            return {
                error: 'No access token available',
                status: 401,
                message: 'Authentication required'
            };
        }

        return await this.makeRequest('/api/v1/admin', {
            method: 'GET'
        }, true);
    }

    /**
     * Generic method for custom API calls
     */
    async customCall(
        endpoint: string,
        method: string = 'GET',
        body?: any,
        requiresAuth: boolean = false
    ): Promise<ApiResponse> {
        const options: RequestInit = {
            method
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        return await this.makeRequest(endpoint, options, requiresAuth);
    }
}