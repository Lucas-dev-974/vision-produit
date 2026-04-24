import { httpClient } from './http-client';
import type { Product, CreateProductDto, UpdateProductDto } from '../entities';

export const productService = {
  listMine: () => httpClient.get<Product[]>('/products/mine'),
  getById: (id: string) => httpClient.get<Product>(`/products/${id}`),
  create: (data: CreateProductDto) => httpClient.post<Product>('/products', data),
  update: (id: string, data: UpdateProductDto) =>
    httpClient.patch<Product>(`/products/${id}`, data),
  delete: (id: string) => httpClient.delete<void>(`/products/${id}`),
};
