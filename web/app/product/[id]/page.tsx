import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    ShoppingCart,
    Star,
    Package,
    ChevronLeft,
    ChevronRight,
    Plus,
    Minus,
    Check,
    Truck,
    Shield,
    RefreshCw,
} from "lucide-react";
import { useRouter } from "@/components/router/router-hook";
import { getPublicProductById } from "@agape/public/products";
import type { IItemRecord } from "@utils/dto/catalogs/item";
import Button from "@/components/ui/button";

/**
 * Product detail page - displays full product information
 * Route: /product/:id
 */
export default function ProductDetailPage() {
    const { params, navigate } = useRouter();
    const [product, setProduct] = useState<IItemRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);

    const productId = Number(params.id);

    useEffect(() => {
        if (!productId || isNaN(productId)) {
            setLoading(false);
            return;
        }

        getPublicProductById(productId)
            .then((data) => {
                setProduct(data ?? null);
            })
            .finally(() => setLoading(false));
    }, [productId]);

    const images = (product?.images as string[]) || [];
    const hasImages = images.length > 0;
    const displayImages = hasImages ? images : ["/placeholder.svg"];

    const nextImage = () => {
        setCurrentImageIndex((prev) =>
            prev === displayImages.length - 1 ? 0 : prev + 1
        );
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) =>
            prev === 0 ? displayImages.length - 1 : prev - 1
        );
    };

    const handleAddToCart = () => {
        // TODO: Integrate with cart context/state
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500">Loading product...</p>
                </div>
            </div>
        );
    }

    // Not found state
    if (!product) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <Package className="w-24 h-24 mx-auto text-slate-300 mb-6" />
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Product Not Found
                    </h1>
                    <p className="text-slate-500 mb-6">
                        The product you're looking for doesn't exist or has been removed.
                    </p>
                    <Button onClick={() => navigate("/")}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Store
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate("/")}
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden sm:inline">Back to Store</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="bg-primary text-white p-2 rounded-xl">
                            <Package className="w-5 h-5" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                            agape<span className="text-primary">.store</span>
                        </span>
                    </div>

                    <Button variant="ghost" className="relative p-2">
                        <ShoppingCart className="w-5 h-5" />
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-8 lg:py-12">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
                    {/* Image Gallery */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {/* Main Image */}
                        <div className="relative aspect-square bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden mb-4">
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={currentImageIndex}
                                    src={displayImages[currentImageIndex]}
                                    alt={product.fullName}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="w-full h-full object-contain p-4"
                                />
                            </AnimatePresence>

                            {displayImages.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}

                            {/* Image Counter */}
                            {displayImages.length > 1 && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full">
                                    {currentImageIndex + 1} / {displayImages.length}
                                </div>
                            )}
                        </div>

                        {/* Thumbnail Gallery */}
                        {displayImages.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {displayImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${idx === currentImageIndex
                                            ? "border-primary shadow-lg"
                                            : "border-transparent opacity-60 hover:opacity-100"
                                            }`}
                                    >
                                        <img
                                            src={img}
                                            alt={`${product.fullName} ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Product Info */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="flex flex-col"
                    >
                        {/* Category & Rating */}
                        <div className="flex items-center gap-4 mb-4">
                            <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                                {product.type === "good" ? "Product" : "Service"}
                            </span>
                            {(product.rating ?? 0) > 0 && (
                                <div className="flex items-center gap-1 text-yellow-500">
                                    <Star className="w-4 h-4 fill-current" />
                                    <span className="font-medium">{product.rating}</span>
                                </div>
                            )}
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
                            {product.fullName}
                        </h1>

                        {/* Slogan */}
                        {product.slogan && (
                            <p className="text-lg text-primary font-medium mb-4 italic">
                                "{product.slogan}"
                            </p>
                        )}

                        {/* Price */}
                        <div className="flex items-baseline gap-3 mb-6">
                            <span className="text-4xl font-black text-slate-900 dark:text-white">
                                ${Number(product.basePrice).toLocaleString()}
                            </span>
                            <span className="text-slate-400 text-sm">COP</span>
                        </div>

                        {/* Description */}
                        {product.description && (
                            <div className="mb-8">
                                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                                    Description
                                </h3>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {product.description}
                                </p>
                            </div>
                        )}

                        {/* Product Details */}
                        <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
                                Details
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Code</span>
                                    <span className="font-mono text-slate-900 dark:text-white">
                                        {product.code}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Type</span>
                                    <span className="text-slate-900 dark:text-white capitalize">
                                        {product.type}
                                    </span>
                                </div>
                                {product.good && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Unit of Measure ID</span>
                                        <span className="text-slate-900 dark:text-white">
                                            {product.good.uomId}
                                        </span>
                                    </div>
                                )}
                                {product.service && (
                                    <>
                                        {product.service.durationMinutes && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Duration</span>
                                                <span className="text-slate-900 dark:text-white">
                                                    {product.service.durationMinutes} min
                                                </span>
                                            </div>
                                        )}
                                        {product.service.isRecurring && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Recurring</span>
                                                <span className="text-green-600">Yes</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Quantity Selector */}
                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Quantity
                            </span>
                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
                                <button
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition-colors"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-12 text-center font-bold text-lg">
                                    {quantity}
                                </span>
                                <button
                                    onClick={() => setQuantity((q) => q + 1)}
                                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Add to Cart Button */}
                        <Button
                            size="lg"
                            className="w-full rounded-2xl h-14 text-lg shadow-lg shadow-primary/20 mb-6"
                            onClick={handleAddToCart}
                        >
                            <AnimatePresence mode="wait">
                                {addedToCart ? (
                                    <motion.span
                                        key="added"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex items-center gap-2"
                                    >
                                        <Check className="w-5 h-5" />
                                        Added to Cart!
                                    </motion.span>
                                ) : (
                                    <motion.span
                                        key="add"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex items-center gap-2"
                                    >
                                        <ShoppingCart className="w-5 h-5" />
                                        Add to Cart - $
                                        {(Number(product.basePrice) * quantity).toLocaleString()}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Button>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <div className="text-center">
                                <Truck className="w-6 h-6 mx-auto text-primary mb-2" />
                                <p className="text-xs text-slate-500">Free Shipping</p>
                            </div>
                            <div className="text-center">
                                <Shield className="w-6 h-6 mx-auto text-primary mb-2" />
                                <p className="text-xs text-slate-500">Secure Payment</p>
                            </div>
                            <div className="text-center">
                                <RefreshCw className="w-6 h-6 mx-auto text-primary mb-2" />
                                <p className="text-xs text-slate-500">Easy Returns</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
