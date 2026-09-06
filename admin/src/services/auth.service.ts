import apiClient from './api.service';

interface LoginResponse {
    success: boolean;
    token: string;
    employee: {
        _id: string;
        name: string;
        email: string;
        role: string;
    };
}

interface LoginRequest {
    email: string;
    password: string;
}

class AuthService {
    async login(credentials: LoginRequest): Promise<LoginResponse> {
        // The API returns { success, message, data: { employee, token } }
        // apiClient.post unwraps response.data, so we receive { success, message, data: { employee, token } }
        const response = await apiClient.post<{ success: boolean; message: string; data: { employee: any; token: string } }>('/auth/employee/login', credentials);
        console.log('Login response:', response); // Debug log

        // Access the nested data object
        if (response.data?.token) {
            localStorage.setItem('admin_token', response.data.token);
            localStorage.setItem('admin_user', JSON.stringify(response.data.employee));
        }

        // Return transformed response for compatibility
        return {
            success: response.success,
            token: response.data?.token || '',
            employee: response.data?.employee
        } as LoginResponse;
    }

    logout(): void {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/login';
    }

    isAuthenticated(): boolean {
        return !!localStorage.getItem('admin_token');
    }

    getToken(): string | null {
        return localStorage.getItem('admin_token');
    }

    getUser(): any {
        const user = localStorage.getItem('admin_user');
        return user ? JSON.parse(user) : null;
    }
}

export default new AuthService();
