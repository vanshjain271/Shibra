/**
 * Address Service
 * 
 * Handles delivery address management
 * CRUD operations for user addresses
 */

import apiClient from './api.service';
import { Address } from '../types/api.types';

export interface AddAddressParams {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface UpdateAddressParams extends Partial<AddAddressParams> {
  addressId: string;
}

class AddressService {
  /**
   * Get all addresses for current user
   */
  async getAddresses(): Promise<Address[]> {
    const response = await apiClient.get('/addresses');
    return response.data;
  }

  /**
   * Get address by ID
   */
  async getAddressById(addressId: string): Promise<Address> {
    const response = await apiClient.get(`/addresses/${addressId}`);
    return response.data;
  }

  /**
   * Add new address
   */
  async addAddress(data: AddAddressParams): Promise<Address> {
    const response = await apiClient.post('/addresses', data);
    return response.data;
  }

  /**
   * Update existing address
   */
  async updateAddress(data: UpdateAddressParams): Promise<Address> {
    const { addressId, ...updateData } = data;
    const response = await apiClient.patch(`/addresses/${addressId}`, updateData);
    return response.data;
  }

  /**
   * Delete address
   */
  async deleteAddress(addressId: string): Promise<void> {
    await apiClient.delete(`/addresses/${addressId}`);
  }

  /**
   * Set default address
   */
  async setDefaultAddress(addressId: string): Promise<Address> {
    const response = await apiClient.patch(`/addresses/${addressId}/set-default`);
    return response.data;
  }
}

export default new AddressService();
