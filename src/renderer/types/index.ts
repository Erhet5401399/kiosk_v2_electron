export interface Category {
  name: string;
  icon: string;
  desc?: string;
}

export interface Service {
  id: number;
  category: string;
  name: string;
  icon: string;
  desc: string;
  price: string;
}

export type PaymentStep = "info" | "payment" | "success";
export type PaymentMethod = "qrcode" | "pos" | null;
export type KeyboardTarget = string;
export type KeyboardInputMode = "alphanumeric" | "numeric";

export * from './steps';
