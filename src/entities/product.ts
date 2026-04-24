export type ProductCategory =
  | 'fruits'
  | 'vegetables'
  | 'eggs'
  | 'honey'
  | 'poultry'
  | 'fish'
  | 'other';

export interface Product {
  id: string;
  producerId: string;
  name: string;
  category: ProductCategory;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  category: ProductCategory;
  description: string;
}

export type UpdateProductDto = Partial<CreateProductDto>;
