import React from "react";
import { CartProvider } from "@/app/cart";

type LayoutProps = {
    children: React.ReactNode;
};

/**
 * Root layout for the entire application.
 * Provides the CartProvider context for shopping cart functionality.
 */
export default function RootLayout({ children }: LayoutProps) {
    return <CartProvider>{children}</CartProvider>;
}
