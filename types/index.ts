export interface Owner {
  uid: string;
  name: string;
  email: string;
  phone: string;
  shopName: string;
  shopLink: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  uid: string;
  name: string;
  email?: string;
  phone: string;
  shopsJoined: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Shop {
  id: string;
  ownerId: string;
  name: string;
  link: string;
  customers: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  price: number;
  description?: string;
  inStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  shopId: string;
  customerId: string;
  amount: number;
  type: "paid" | "due" | "advance";
  description?: string;
  createdAt: Date;
}
