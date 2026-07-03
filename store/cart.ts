"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/types";

interface CartState {
    items: CartItem[];
    addItem: (product: Product, qty?: number) => void;
    removeItem: (productId: string) => void;
    updateQty: (productId: string, qty: number) => void;
    clear: () => void;
    total: () => number;
    count: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (product, qty = 1) => {
                const items = get().items;
                const existing = items.find((i) => i.product.id === product.id);
                if (existing) {
                    set({ items: items.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i) });
                } else {
                    set({ items: [...items, { product, quantity: qty }] });
                }
            },

            removeItem: (productId) => set({ items: get().items.filter((i) => i.product.id !== productId) }),

            updateQty: (productId, qty) => {
                if (qty <= 0) { get().removeItem(productId); return; }
                set({ items: get().items.map((i) => i.product.id === productId ? { ...i, quantity: qty } : i) });
            },

            clear: () => set({ items: [] }),

            total: () => get().items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0),

            count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
        }),
        { name: "cart" }
    )
);
