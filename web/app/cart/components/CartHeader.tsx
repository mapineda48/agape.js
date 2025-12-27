import { ShoppingCart, X } from "lucide-react";
import Button from "@/components/ui/button";

interface CartHeaderProps {
    onClose: () => void;
}

/**
 * Cart drawer header with title and close button
 */
export function CartHeader({ onClose }: CartHeaderProps) {
    return (
        <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" /> Your Cart
            </h2>
            <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="rounded-full w-8 h-8 p-0"
                aria-label="Close cart"
            >
                <X className="w-5 h-5" />
            </Button>
        </div>
    );
}
