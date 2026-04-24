import type { ProductCategory } from './product';

export interface PublicProducer {
  id: string;
  companyName: string | null;
  city: string | null;
  postalCode: string | null;
  description: string | null;
  profilePhotoUrl: string | null;
  publicLocation: { lat: number; lng: number } | null;
  averageRating: number;
  totalRatings: number;
  reliabilityScore: number;
  totalOrders: number;
}

export interface PublicProducerCatalogProduct {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
}

export interface PublicProducerStockRow {
  stockId: string;
  productId: string;
  productName: string;
  category: ProductCategory;
  description: string;
  unit: string;
  unitPrice: string;
  quantityAvailable: string;
  availableFrom: string;
  expiresAt: string;
}

/** `GET /public/producers/:id` — fiche détaillée + catalogue + stocks disponibles */
export interface PublicProducerDetail extends PublicProducer {
  additionalPhotos: string[];
  products: PublicProducerCatalogProduct[];
  stocks: PublicProducerStockRow[];
}
