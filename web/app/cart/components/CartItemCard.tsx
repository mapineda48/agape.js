import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import type { CartItem } from "../CartContext";

interface CartItemCardProps {
    item: CartItem;
    index: number;
    onRemove: (index: number) => void;
}

/**
 * Individual cart item card component
 * Memoized to prevent unnecessary re-renders
 */
export const CartItemCard = memo(function CartItemCard({
    item,
    index,
    onRemove,
}: CartItemCardProps) {
    const handleRemove = useCallback(() => {
        onRemove(index);
    }, [onRemove, index]);

    const imageUrl = (item.images as string[])?.[0] || "/placeholder.svg";
    const formattedPrice = Number(item.basePrice).toLocaleString();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl"
        >
            <div className="w-16 h-16 rounded-lg bg-white overflow-hidden shrink-0">
                <img
                    src={imageUrl}
                    className="w-full h-full object-cover"
                    alt={item.fullName}
                    loading="lazy"
                />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-slate-900 dark:text-white truncate">
                    {item.fullName}
                </h4>
                <p className="text-primary font-bold text-sm">
                    ${formattedPrice}
                    {item.quantity > 1 && (
                        <span className="text-slate-400 font-normal">
                            {" "}× {item.quantity}
                        </span>
                    )}
                </p>
            </div>
            <button
                onClick={handleRemove}
                className="text-slate-400 hover:text-red-500 transition-colors p-2"
                aria-label={`Remove ${item.fullName} from cart`}
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </motion.div>
    );
});
