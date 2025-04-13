import Link from "next/link";
import { motion } from "framer-motion";
import { Pencil, BookOpen, Backpack, ShoppingCart } from "lucide-react";
import Button from "@client/components/ui/button";
import { Card, CardContent } from "@client/components/ui/card";

export default function AgapeLandingPage() {
  return (
    <div className="bg-light text-dark min-h-screen">
      {/* Hero Section */}
      <section className="bg-primary text-white py-20 px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold mb-4"
        >
          ¡Bienvenido a Papelería Ágape!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl max-w-xl mx-auto"
        >
          Todo lo que necesitas para la escuela, oficina y creatividad en un
          solo lugar.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Button size="lg" variant="accent">
            Ver catálogo
          </Button>
        </motion.div>
      </section>

      {/* Productos Destacados */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-semibold text-center mb-12 text-primary">
          Nuestros productos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="text-center border border-secondary/30">
            <CardContent className="p-6">
              <Pencil className="mx-auto w-12 h-12 text-accent mb-4" />
              <h3 className="font-bold text-lg text-dark">Útiles escolares</h3>
              <p className="text-sm text-muted-foreground">
                Lápices, colores, cuadernos y todo lo que necesitan los más
                pequeños.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border border-secondary/30">
            <CardContent className="p-6">
              <BookOpen className="mx-auto w-12 h-12 text-accent mb-4" />
              <h3 className="font-bold text-lg text-dark">Libros y agendas</h3>
              <p className="text-sm text-muted-foreground">
                Encuentra libros de texto, agendas escolares y material de
                lectura.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border border-secondary/30">
            <CardContent className="p-6">
              <Backpack className="mx-auto w-12 h-12 text-accent mb-4" />
              <h3 className="font-bold text-lg text-dark">
                Morrales y loncheras
              </h3>
              <p className="text-sm text-muted-foreground">
                Variedad en mochilas, maletines y loncheras con diseños únicos.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border border-secondary/30">
            <CardContent className="p-6">
              <ShoppingCart className="mx-auto w-12 h-12 text-accent mb-4" />
              <h3 className="font-bold text-lg text-dark">
                Papelería en general
              </h3>
              <p className="text-sm text-muted-foreground">
                Desde hojas hasta carpetas, sobres y elementos de oficina.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-muted py-16 px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-primary">
          Visítanos y encuentra todo para este regreso a clases
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-6">
          Ágape está listo para acompañarte en cada paso del aprendizaje y la
          organización.
        </p>
        <Button size="lg" variant="primary">
          Contáctanos
        </Button>
      </section>

      {/* Footer discreto con acceso al CMS */}
      <footer className="text-xs text-muted-foreground px-4 py-1 border-t border-secondary/20 bg-light text-center flex justify-between items-center">
        <span>
          © {new Date().getFullYear()} Papelería Ágape. Todos los derechos
          reservados.
        </span>
        <Link
          href="/cms"
          className="hover:underline text-muted-foreground hover:text-accent transition-colors duration-200"
        >
          CMS
        </Link>
      </footer>
    </div>
  );
}
