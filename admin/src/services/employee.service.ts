import apiClient from './api.service';

class EmployeeService {
    async getEmployees(): Promise<any> {
        return apiClient.get('/admin/employees');
    }

    async createEmployee(data: any): Promise<any> {
        return apiClient.post('/admin/employees', data);
    }

    async updateEmployee(id: string, data: any): Promise<any> {
        return apiClient.put(`/admin/employees/${id}`, data);
    }

    async deleteEmployee(id: string): Promise<any> {
        return apiClient.delete(`/admin/employees/${id}`);
    }
}

export default new EmployeeService();
