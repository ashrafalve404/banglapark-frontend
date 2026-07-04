"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/types";

function itemKey(productId: string, size?: string) {
    return size ? `${productId}::${size}` : productId;
}

interface CartState {
    items: CartItem[];
    addItem: (product: Product, qty?: number, size?: string) => void;
    removeItem: (productId: string, size?: string) => void;
    updateQty: (productId: string, qty: number, size?: string) => void;
    clear: () => void;
    total: () => number;
    count: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (product, qty = 1, size) => {
                const items = get().items;
                const key = itemKey(product.id, size);
                const existing = items.find((i) => itemKey(i.product.id, i.size) === key);
                if (existing) {
                    set({ items: items.map((i) => itemKey(i.product.id, i.size) === key ? { ...i, quantity: i.quantity + qty } : i) });
                } else {
                    set({ items: [...items, { product, quantity: qty, size }] });
                }
            },

            removeItem: (productId, size) => set({ items: get().items.filter((i) => itemKey(i.product.id, i.size) !== itemKey(productId, size)) }),

            updateQty: (productId, qty, size) => {
                if (qty <= 0) { get().removeItem(productId, size); return; }
                const key = itemKey(productId, size);
                set({ items: get().items.map((i) => itemKey(i.product.id, i.size) === key ? { ...i, quantity: qty } : i) });
            },

            clear: () => set({ items: [] }),

            total: () => get().items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0),

            count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
        }),
        { name: "cart" }
    )
);
