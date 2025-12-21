import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Menu,
  X,
  Plus,
  ArrowRight,
  Star,
  Check,
  Package,
  Trash2,
} from "lucide-react";
import { getPublicProducts } from "@agape/public/products";
import type { ListItemItem } from "@utils/dto/catalogs/item";
import Button from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createPortal } from "react-dom";

// --- Components ---

function Navbar({
  cartCount,
  onOpenCart,
}: {
  cartCount: number;
  onOpenCart: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm py-4"
        : "bg-transparent py-6"
        }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-white p-2 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            agape<span className="text-primary">.store</span>
          </span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="#hero"
            className="hidden md:block text-sm font-medium hover:text-primary transition-colors"
          >
            Inicio
          </a>
          <a
            href="#about"
            className="hidden md:block text-sm font-medium hover:text-primary transition-colors"
          >
            Nosotros
          </a>
          <a
            href="#store"
            className="hidden md:block text-sm font-medium hover:text-primary transition-colors"
          >
            Tienda
          </a>
          <Button
            variant="ghost"
            className="relative p-2"
            onClick={onOpenCart}
          >
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              >
                {cartCount}
              </motion.span>
            )}
          </Button>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-sky-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800"
    >
      <div className="absolute inset-0 opacity-30 dark:opacity-10 pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 left-20 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10 grid md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            ✨ Tu papelería favorita
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">
            Creatividad <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
              sin límites.
            </span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-lg leading-relaxed">
            Descubre nuestra colección exclusiva de artículos de papelería,
            arte y oficina. Calidad premium para tus mejores ideas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="rounded-full px-8 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
              onClick={() => document.getElementById("store")?.scrollIntoView({ behavior: "smooth" })}
            >
              Ver productos
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 text-base border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
            >
              Conócenos
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative hidden md:block"
        >
          <div className="relative z-10 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
            <img
              src="https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800"
              alt="Stationery"
              className="rounded-2xl w-full h-[400px] object-cover"
            />
            <div className="absolute -bottom-6 -right-6 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl flex items-center gap-3">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full text-green-600 dark:text-green-400">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Envío Gratis</p>
                <p className="text-xs text-slate-500">En pedidos +$50k</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="py-24 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">¿Quiénes somos?</h2>
          <div className="h-1 w-20 bg-primary mx-auto rounded-full mb-6"></div>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            En <span className="font-bold text-primary">Agape</span>, nos apasiona el arte de crear.
            Desde cuadernos artesanales hasta los mejores bolígrafos importados,
            seleccionamos cada producto pensando en inspirarte.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "Calidad Premium", icon: "✨", desc: "Solo las mejores marcas y materiales duraderos." },
            { title: "Diseño Moderno", icon: "🎨", desc: "Productos que combinan funcionalidad y estética." },
            { title: "Envío Rápido", icon: "🚀", desc: "Recibe tus compras en la puerta de tu casa en tiempo récord." }
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">{item.title}</h3>
              <p className="text-slate-500 dark:text-slate-400">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Store({ addToCart }: { addToCart: (item: ListItemItem) => void }) {
  const [products, setProducts] = useState<ListItemItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicProducts().then((res) => {
      setProducts(res.items);
      setLoading(false);
    });
  }, []);

  return (
    <section id="store" className="py-24 bg-slate-50 dark:bg-slate-900/50">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-slate-900 dark:text-white">Nuestra Colección</h2>
            <p className="text-slate-500">Explora lo último en papelería.</p>
          </div>
          {/* Filtros podrían ir aquí */}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="h-80 rounded-2xl bg-white dark:bg-slate-800 animate-pulse shadow-sm"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => {
              const images = product.images as string[];
              const image = images && images.length > 0 ? images[0] : "/placeholder.svg";

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden bg-white dark:bg-slate-800 rounded-3xl group">
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      <img
                        src={image}
                        alt={product.fullName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm dark:bg-slate-900/90 text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
                        {product.rating > 0 ? (
                          <span className="flex items-center gap-1 text-yellow-500">
                            <Star className="w-3 h-3 fill-current" /> {product.rating}
                          </span>
                        ) : "Nuevo"}
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 line-clamp-1" title={product.fullName}>
                        {product.fullName}
                      </h3>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-2xl font-bold text-primary">
                          ${Number(product.basePrice).toLocaleString()}
                        </span>
                        <Button
                          size="sm"
                          className="rounded-full w-10 h-10 p-0"
                          onClick={() => addToCart(product)}
                        >
                          <Plus className="w-5 h-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function CartDrawer({
  isOpen,
  onClose,
  cart,
  removeFromCart
}: {
  isOpen: boolean;
  onClose: () => void;
  cart: ListItemItem[];
  removeFromCart: (idx: number) => void;
}) {
  // Calculamos total
  const total = cart.reduce((sum, item) => sum + Number(item.basePrice), 0);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
                <ShoppingCart className="w-5 h-5" /> Tu Carrito
              </h2>
              <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full w-8 h-8 p-0">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
                  <p>Tu carrito está vacío.</p>
                  <Button variant="link" onClick={onClose}>Ir a comprar</Button>
                </div>
              ) : (
                cart.map((item, index) => (
                  <motion.div
                    layout
                    key={`${item.id}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl"
                  >
                    <div className="w-16 h-16 rounded-lg bg-white overflow-hidden shrink-0">
                      <img
                        src={(item.images as string[])?.[0] || "/placeholder.svg"}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-slate-900 dark:text-white truncate">{item.fullName}</h4>
                      <p className="text-primary font-bold text-sm">${Number(item.basePrice).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(index)}
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
                  ${total.toLocaleString()}
                </span>
              </div>
              <Button
                className="w-full rounded-xl h-12 text-lg shadow-lg shadow-primary/20"
                disabled={cart.length === 0}
                onClick={() => {
                  alert("Iniciando pasarela de pagos... (Demo)");
                  // Aquí iría la lógica de redirección a Stripe/Wompi/etc.
                }}
              >
                Proceder al pago
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12">
      <div className="container mx-auto px-6 text-center md:text-left">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">agape.store</h3>
            <p className="text-sm leading-relaxed">Tu aliado en creatividad y organización. Productos de calidad para mentes brillantes.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Enlaces</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Inicio</a></li>
              <li><a href="#store" className="hover:text-white transition-colors">Tienda</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">Nosotros</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Ayuda</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Envíos</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Devoluciones</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Síguenos</h4>
            <div className="flex justify-center md:justify-start gap-4">
              {/* Social Icons Placeholder */}
              <div className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"></div>
              <div className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"></div>
              <div className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"></div>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© {new Date().getFullYear()} Agape Stationery. Todos los derechos reservados.</p>
          <a href="/cms" className="hover:text-white transition-colors">Acceso Interno (CMS)</a>
        </div>
      </div>
    </footer>
  );
}

// --- Main Page Component ---

export default function AgapeLandingPage() {
  const [cart, setCart] = useState<ListItemItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (item: ListItemItem) => {
    setCart([...cart, item]);
    setIsCartOpen(true);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black font-sans text-slate-900 selection:bg-primary/20">
      <Navbar cartCount={cart.length} onOpenCart={() => setIsCartOpen(true)} />

      <main>
        <Hero />
        <About />
        <Store addToCart={addToCart} />
      </main>

      <Footer />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        removeFromCart={removeFromCart}
      />
    </div>
  );
}