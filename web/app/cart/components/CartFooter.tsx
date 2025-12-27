import { useCallback } from "react";
import Button from "@/components/ui/button";

interface CartFooterProps {
    totalPrice: number;
    itemCount: number;
}

/**
 * Cart footer with total price and checkout button
 */
export function CartFooter({ totalPrice, itemCount }: CartFooterProps) {
    const handleCheckout = useCallback(() => {
        // TODO: Integrate with payment gateway (Stripe/Wompi/etc.)
        alert("Starting payment gateway... (Demo)");
    }, []);

    const formattedTotal = totalPrice.toLocaleString();
    const isDisabled = itemCount === 0;

    return (
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex justify-between items-center mb-6">
                <span className="text-slate-500">Total</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                    ${formattedTotal}
                </span>
            </div>
            <Button
                className="w-full rounded-xl h-12 text-lg shadow-lg shadow-primary/20"
                disabled={isDisabled}
                onClick={handleCheckout}
            >
                Proceed to Checkout
            </Button>
        </div>
    );
}
