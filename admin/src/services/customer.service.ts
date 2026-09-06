import apiClient from './api.service';
import { Customer, PaginatedResponse } from '../types/api.types';

class CustomerService {
  async getCustomers(page = 1, limit = 50, search?: string): Promise<PaginatedResponse<Customer>> {
    return apiClient.get('/admin/customers', { page, limit, search });
  }

  async getCustomerById(id: string): Promise<Customer> {
    return apiClient.get(`/admin/customers/${id}`);
  }

  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    return apiClient.post('/admin/customers', data);
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    return apiClient.patch(`/admin/customers/${id}`, data);
  }

  async deleteCustomer(id: string): Promise<void> {
    return apiClient.delete(`/admin/customers/${id}`);
  }
}

export default new CustomerService();
