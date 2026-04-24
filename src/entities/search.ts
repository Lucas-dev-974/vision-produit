import type { ProductCategory } from './product';
import type { PublicProducer } from './public-producer';

/** Réponse `GET /search/producers` */
export interface SearchProducerHit extends PublicProducer {
  distanceKm: number;
}

/** Réponse `GET /search/products` */
export interface SearchProductHit {
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
  producerId: string;
  companyName: string | null;
}

export type ProducerSort = 'distance' | 'name' | 'rating';
