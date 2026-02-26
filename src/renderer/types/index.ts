import type { ServiceFlowConfig } from './steps';

export interface Category {
  id?: number;
  name: string;
  icon: string;
  desc?: string;
}

export interface Service {
  id: number;
  cat_id?: number;
  category: string;
  name: string;
  icon: string;
  desc: string;
  price: string;
  status?: boolean;
  config?: ServiceFlowConfig;
}

export type PaymentStep = "info" | "payment" | "success";
export type PaymentMethod = "qrcode" | "pos" | null;

export * from './steps';
