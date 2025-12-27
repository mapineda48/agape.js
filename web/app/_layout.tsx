import React from "react";
import { CartProvider, CartDrawer } from "@/app/cart";

type LayoutProps = {
    children: React.ReactNode;
};

/**
 * Root layout for the entire application.
 * Provides the CartProvider context and renders the CartDrawer globally.
 * 
 * The CartDrawer is rendered here once, so individual pages don't need
 * to include it - they just need to use the useCart() hook to interact
 * with the cart functionality.
 */
export default function RootLayout({ children }: LayoutProps) {
    return (
        <CartProvider>
            {children}
            <CartDrawer />
        </CartProvider>
    );
}
