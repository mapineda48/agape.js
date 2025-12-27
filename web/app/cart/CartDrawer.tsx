import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useCart } from "./CartContext";
import { CartHeader, CartItemCard, CartFooter, EmptyCart } from "./components";

/**
 * Drawer animation variants for Framer Motion
 */
const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const drawerVariants = {
    hidden: { x: "100%" },
    visible: { x: 0 },
};

const drawerTransition = {
    type: "spring",
    damping: 25,
    stiffness: 200,
} as const;

/**
 * Cart drawer component that displays the shopping cart contents.
 * Uses createPortal to render at the document body level.
 * Should be rendered once at the root layout level.
 */
export function CartDrawer() {
    const { items, isOpen, closeCart, removeItem, totalPrice } = useCart();

    const handleRemoveItem = useCallback(
        (index: number) => {
            removeItem(index);
        },
        [removeItem]
    );

    // Don't render portal during SSR
    if (typeof document === "undefined") {
        return null;
    }

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        onClick={closeCart}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                        aria-hidden="true"
                    />

                    {/* Drawer */}
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Shopping cart"
                        variants={drawerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        transition={drawerTransition}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-[70] flex flex-col"
                    >
                        <CartHeader onClose={closeCart} />

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {items.length === 0 ? (
                                <EmptyCart onClose={closeCart} />
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {items.map((item, index) => (
                                        <CartItemCard
                                            key={`${item.id}-${index}`}
                                            item={item}
                                            index={index}
                                            onRemove={handleRemoveItem}
                                        />
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>

                        <CartFooter totalPrice={totalPrice} itemCount={items.length} />
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
