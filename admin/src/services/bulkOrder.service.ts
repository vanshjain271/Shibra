import apiClient from './api.service';

class BulkOrderService {
    async getBulkOrders(page = 1, limit = 20, status?: string): Promise<any> {
        const response = await apiClient.get<any>('/admin/bulk-orders', { page, limit, status });
        return response;
    }

    async getBulkOrderById(id: string): Promise<any> {
        return apiClient.get(`/admin/bulk-orders/${id}`);
    }

    async createBulkOrder(data: any): Promise<any> {
        return apiClient.post('/admin/bulk-orders', data);
    }

    async updateStatus(id: string, status: string, trackingNumber?: string): Promise<any> {
        return apiClient.put(`/admin/bulk-orders/${id}/status`, { status, trackingNumber });
    }

    async updatePayment(id: string, paymentStatus: string, advanceAmount?: number): Promise<any> {
        return apiClient.put(`/admin/bulk-orders/${id}/payment`, { paymentStatus, advanceAmount });
    }

    async deleteBulkOrder(id: string): Promise<any> {
        return apiClient.delete(`/admin/bulk-orders/${id}`);
    }
}

export default new BulkOrderService();
