import { createContext, useContext, useState, type ReactNode } from "react";
import type { ListItemItem } from "@utils/dto/catalogs/item";

/**
 * Cart item with quantity
 */
export interface CartItem extends ListItemItem {
    quantity: number;
}

/**
 * Cart context value
 */
interface CartContextValue {
    items: CartItem[];
    isOpen: boolean;
    totalItems: number;
    totalPrice: number;
    addItem: (item: ListItemItem, quantity?: number) => void;
    removeItem: (index: number) => void;
    updateQuantity: (index: number, quantity: number) => void;
    clearCart: () => void;
    openCart: () => void;
    closeCart: () => void;
    toggleCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/**
 * Hook to access cart context
 */
export function useCart(): CartContextValue {
    const ctx = useContext(CartContext);
    if (!ctx) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return ctx;
}

/**
 * Cart provider component - wraps the app to provide global cart state
 */
export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce(
        (sum, item) => sum + Number(item.basePrice) * item.quantity,
        0
    );

    const addItem = (item: ListItemItem, quantity = 1) => {
        setItems((prev) => {
            // Check if item already exists in cart
            const existingIndex = prev.findIndex((i) => i.id === item.id);
            if (existingIndex >= 0) {
                // Update quantity
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    quantity: updated[existingIndex].quantity + quantity,
                };
                return updated;
            }
            // Add new item
            return [...prev, { ...item, quantity }];
        });
        setIsOpen(true);
    };

    const removeItem = (index: number) => {
        setItems((prev) => {
            const updated = [...prev];
            updated.splice(index, 1);
            return updated;
        });
    };

    const updateQuantity = (index: number, quantity: number) => {
        if (quantity <= 0) {
            removeItem(index);
            return;
        }
        setItems((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], quantity };
            return updated;
        });
    };

    const clearCart = () => {
        setItems([]);
    };

    const openCart = () => setIsOpen(true);
    const closeCart = () => setIsOpen(false);
    const toggleCart = () => setIsOpen((prev) => !prev);

    return (
        <CartContext.Provider
            value={{
                items,
                isOpen,
                totalItems,
                totalPrice,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                openCart,
                closeCart,
                toggleCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}
