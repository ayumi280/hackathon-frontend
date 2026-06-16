export interface User {
  id: number;
  email: string;
  username: string;
  avatar_url: string;
  bio: string;
  rating: number;
  created_at: string;
}

export interface ItemImage {
  id: number;
  item_id: number;
  url: string;
  display_order: number;
}

export interface Tag {
  id: number;
  name: string;
  trend_score: number;
}

export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
}

export type ItemStatus = 'selling' | 'trading' | 'sold';

export interface Item {
  id: number;
  seller_id: number;
  seller: User;
  title: string;
  description: string;
  price: number;
  status: ItemStatus;
  category_id: number | null;
  category: Category;
  images: ItemImage[];
  tags: Tag[];
  like_count: number;
  is_liked: boolean;
  created_at: string;
}

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'countered';

export interface Offer {
  id: number;
  item_id: number;
  item: Item;
  buyer_id: number;
  buyer: User;
  offered_price: number;
  status: OfferStatus;
  counter_price: number | null;
  message: string;
  created_at: string;
}

export type TransactionStatus = 'pending' | 'shipping' | 'completed' | 'canceled';

export interface Transaction {
  id: number;
  item_id: number;
  item: Item;
  buyer_id: number;
  buyer: User;
  seller_id: number;
  seller: User;
  final_price: number;
  status: TransactionStatus;
  created_at: string;
}

export interface AIAssistResult {
  title: string;
  description: string;
  category: string;
  tags: string[];
  suggest_price: number;
}
