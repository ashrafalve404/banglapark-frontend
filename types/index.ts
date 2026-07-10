// Shared TypeScript types matching backend DTOs

export type Role = "USER" | "ADMIN" | "SUPER_ADMIN";
export type UserStatus = "ACTIVE" | "INACTIVE";
export type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentMethod = "CASH_ON_DELIVERY" | "BKASH";
export type DeliveryArea = "INSIDE_DHAKA" | "OUTSIDE_DHAKA";
export type WithdrawStatus = "PENDING" | "APPROVED" | "REJECTED";
export type WithdrawMethod = "BKASH" | "NAGAD" | "ROCKET" | "BANK";
export type TxType = "GENERATION_COMMISSION" | "DAILY_BENEFIT" | "PURCHASE" | "WITHDRAWAL" | "REFUND" | "ADMIN_ADJUSTMENT";
export type NotificationType = "ACTIVATION_REMINDER" | "COMMISSION_RECEIVED" | "DAILY_BENEFIT_RECEIVED" | "WITHDRAWAL_STATUS" | "ORDER_STATUS" | "SYSTEM";

export interface User {
    id: string;
    memberId?: number;
    name: string;
    email: string;
    phone: string;
    role: Role;
    status: UserStatus;
    referralCode: string;
    referralLink?: string;
    parentId?: string;
    activeUntil?: string;
    isFirstActivated: boolean;
    isBanned: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Wallet {
    id: string;
    userId: string;
    balance: number;
    pendingWithdrawal: number;
    availableBalance: number;
}

export interface WalletTransaction {
    id: string;
    walletId: string;
    type: TxType;
    amount: number;
    balanceAfter: number;
    referenceId?: string;
    description: string;
    createdAt: string;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
}

export interface Product {
    id: string;
    name: string;
    slug: string;
    description?: string;
    price: number;
    stock: number;
    categoryId: string;
    category?: Category;
    images: string[];
    sizes: string[];
    isActive: boolean;
    clicks: number;
    createdAt: string;
}

export interface OrderItem {
    id: string;
    productId: string;
    product: Pick<Product, "id" | "name" | "slug" | "images" | "price">;
    quantity: number;
    price: number;
    size?: string;
}

export interface Order {
    id: string;
    userId: string;
    user?: Pick<User, "id" | "name" | "phone" | "email">;
    items: OrderItem[];
    total: number;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    transactionId?: string;
    userBkashNumber?: string;
    deliveryArea?: DeliveryArea;
    deliveryCharge?: number;
    isQualifying: boolean;
    shippingAddress?: Record<string, string>;
    notes?: string;
    deliveredAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface WithdrawalRequest {
    id: string;
    userId: string;
    user?: Pick<User, "id" | "name" | "phone" | "email">;
    amount: number;
    method: WithdrawMethod;
    accountDetails: Record<string, string>;
    status: WithdrawStatus;
    reason?: string;
    reviewedById?: string;
    createdAt: string;
    reviewedAt?: string;
}

export interface GenerationCommission {
    id: string;
    toUserId: string;
    fromUserId: string;
    toUser?: Pick<User, "id" | "name" | "email">;
    fromUser?: Pick<User, "id" | "name" | "email">;
    orderId?: string;
    level: number;
    amount: number;
    createdAt: string;
}

export interface DailyBenefitLog {
    id: string;
    userId: string;
    user?: Pick<User, "id" | "name" | "email">;
    date: string;
    teamCount: number;
    amount: number;
    createdAt: string;
}

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    isRead: boolean;
    createdAt: string;
}

export interface PlatformConfig {
    id: string;
    key: string;
    value: unknown;
    updatedAt: string;
}

export interface PaginatedResponse<T> {
    data?: T[];
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

export interface CartItem {
    product: Product;
    quantity: number;
    size?: string;
}

export interface BenefitTier {
    minCount: number;
    amount: number;
}

export interface AdminStats {
    users: { total: number; active: number; inactive: number };
    orders: { total: number; delivered: number };
    totalRevenue: number;
    totalCommissionsPaid: number;
    pendingWithdrawals: number;
}
