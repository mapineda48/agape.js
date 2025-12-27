import { ShoppingCart } from "lucide-react";
import Button from "@/components/ui/button";

interface EmptyCartProps {
    onClose: () => void;
}

/**
 * Empty cart state component
 */
export function EmptyCart({ onClose }: EmptyCartProps) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
            <p>Your cart is empty.</p>
            <Button variant="link" onClick={onClose}>
                Go shopping
            </Button>
        </div>
    );
}
