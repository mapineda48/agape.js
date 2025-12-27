import React from "react";
import { CartProvider, CartDrawer } from "@/app/cart";
import { Chat } from "@/app/chat";

type LayoutProps = {
    children: React.ReactNode;
};

/**
 * Root layout for the entire application.
 * Provides the CartProvider context and renders global UI components.
 *
 * Global components rendered here:
 * - CartDrawer: Shopping cart slide-out drawer
 * - Chat: Floating global chat widget
 *
 * Individual pages don't need to include these components - they just
 * need to use the respective hooks (useCart, useChatSocket) to interact
 * with their functionality.
 */
export default function RootLayout({ children }: LayoutProps) {
    return (
        <CartProvider>
            {children}
            <CartDrawer />
            <Chat />
        </CartProvider>
    );
}
