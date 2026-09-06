import apiClient from './api.service';
import { Product } from '../types/api.types';

class ProductService {
  async getProducts(page = 1, limit = 50, search?: string, sort?: string, isLot?: boolean): Promise<any> {
    // Use admin endpoint to get all products
    const response = await apiClient.get<any>('/admin/products', { page, limit, search, sort, isLot });
    return response;
  }

  async getProductById(id: string): Promise<Product> {
    return apiClient.get(`/products/${id}`);
  }
}

export default new ProductService();
