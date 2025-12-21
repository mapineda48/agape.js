import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { ShoppingCart, X, Trash2 } from "lucide-react";
import { useCart } from "./CartContext";
import Button from "@/components/ui/button";

/**
 * Cart drawer component that displays the shopping cart contents
 */
export function CartDrawer() {
    const { items, isOpen, closeCart, removeItem, totalPrice } = useCart();

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeCart}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    />
                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-[70] flex flex-col"
                    >
                        <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5" /> Your Cart
                            </h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={closeCart}
                                className="rounded-full w-8 h-8 p-0"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
                                    <p>Your cart is empty.</p>
                                    <Button variant="link" onClick={closeCart}>
                                        Go shopping
                                    </Button>
                                </div>
                            ) : (
                                items.map((item, index) => (
                                    <motion.div
                                        layout
                                        key={`${item.id}-${index}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl"
                                    >
                                        <div className="w-16 h-16 rounded-lg bg-white overflow-hidden shrink-0">
                                            <img
                                                src={
                                                    (item.images as string[])?.[0] || "/placeholder.svg"
                                                }
                                                className="w-full h-full object-cover"
                                                alt=""
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-sm text-slate-900 dark:text-white truncate">
                                                {item.fullName}
                                            </h4>
                                            <p className="text-primary font-bold text-sm">
                                                ${Number(item.basePrice).toLocaleString()}
                                                {item.quantity > 1 && (
                                                    <span className="text-slate-400 font-normal">
                                                        {" "}
                                                        × {item.quantity}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => removeItem(index)}
                                            className="text-slate-400 hover:text-red-500 transition-colors p-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-slate-500">Total</span>
                                <span className="text-2xl font-black text-slate-900 dark:text-white">
                                    ${totalPrice.toLocaleString()}
                                </span>
                            </div>
                            <Button
                                className="w-full rounded-xl h-12 text-lg shadow-lg shadow-primary/20"
                                disabled={items.length === 0}
                                onClick={() => {
                                    alert("Starting payment gateway... (Demo)");
                                    // Here goes the redirect logic to Stripe/Wompi/etc.
                                }}
                            >
                                Proceed to Checkout
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
