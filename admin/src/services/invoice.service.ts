import apiClient from './api.service';

class InvoiceService {
    async getInvoices(page = 1, limit = 500, status?: string): Promise<any> {
        const response = await apiClient.get<any>('/admin/invoices', { page, limit, status });
        return response;
    }

    async getInvoiceById(id: string): Promise<any> {
        return apiClient.get(`/admin/invoices/${id}`);
    }

    async regeneratePDF(id: string): Promise<any> {
        return apiClient.post(`/admin/invoices/${id}/regenerate-pdf`);
    }

    async createInvoice(orderId: string): Promise<any> {
        return apiClient.post('/admin/invoices/create', { orderId });
    }
}

export default new InvoiceService();
