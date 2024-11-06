import { Pen, Notebook, Paperclip, Mail, Menu } from "lucide-react";
import { useRouter } from "router";

export default function Component() {
  return (
    <div className="bg-stone-50 min-h-screen">
      <Navbar />

      <HeroSection />

      <AboutUsSection />

      <FeaturedProducts />

      <SubscribeSection />

      <Footer />
    </div>
  );
}

function Navbar() {
  const history = useRouter();

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <span className="text-2xl font-bold text-amber-600">Agape</span>
          <div className="hidden md:flex space-x-6">
            <span
              onClick={() => history.push("/shop")}
              className="text-stone-600 hover:text-amber-600 cursor-pointer"
            >
              Tienda
            </span>
            <a
              href="#AboutUsSection"
              className="text-stone-600 hover:text-amber-600 cursor-pointer"
            >
              Acerca
            </a>
            <a
              href="#SubscribeSection"
              className="text-stone-600 hover:text-amber-600 cursor-pointer"
            >
              Contacto
            </a>
          </div>
          <button className="md:hidden">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open menu</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  const history = useRouter();

  return (
    <header className="bg-stone-100 py-16">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
        <div className="md:w-1/2 mb-8 md:mb-0">
          <h1 className="text-4xl md:text-5xl font-bold text-stone-800 mb-4">
            Elabora tu historia
          </h1>
          <p className="text-xl text-stone-600 mb-6 p-1">
            Descubre la cuidada colección de papelería premium de Agape
          </p>
          <button
            onClick={() => history.push("/shop")}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded"
          >
            Comprar Ahora
          </button>
        </div>
        <div className="md:w-1/2">
          <img
            src="/assets/img/placeholder.svg"
            alt="Featured Agape stationery products"
            className="rounded-lg shadow-lg"
            style={{ width: 400, height: 300, objectFit: "cover" }}
          />
        </div>
      </div>
    </header>
  );
}

function AboutUsSection() {
  return (
    <section id="AboutUsSection" className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-semibold text-stone-800 mb-6 text-center">
          Acerca de Agape
        </h2>
        <p className="text-lg text-stone-600 max-w-2xl mx-auto text-center">
          En Agape, nos apasiona proporcionar artículos de papelería de alta
          calidad que inspiren creatividad y productividad. Desde lujosos
          cuadernos hasta bolígrafos de precisión, seleccionamos solo los
          mejores productos para nuestros clientes más exigentes.
        </p>
      </div>
    </section>
  );
}

function FeaturedProducts() {
  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-semibold text-stone-800 mb-10 text-center">
          Productos destacados
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-stone-50 rounded-lg p-6 shadow-md">
            <Pen className="w-12 h-12 text-amber-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Bolígrafos de lujo</h3>
            <p className="text-stone-600">Escribe con elegancia y precisión</p>
          </div>
          <div className="bg-stone-50 rounded-lg p-6 shadow-md">
            <Notebook className="w-12 h-12 text-amber-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Portátiles Premium</h3>
            <p className="text-stone-600">
              Captura tus pensamientos con estilo
            </p>
          </div>
          <div className="bg-stone-50 rounded-lg p-6 shadow-md">
            <Paperclip className="w-12 h-12 text-amber-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              Accesorios de escritorio
            </h3>
            <p className="text-stone-600">
              Organiza tu espacio de forma bonita
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SubscribeSection() {
  return (
    <section id="SubscribeSection" className="bg-amber-600 py-16">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-semibold text-white mb-6">
          Únete a nuestra lista de correo
        </h2>
        <p className="text-lg text-amber-100 mb-8">
          Manténgase actualizado con los últimos productos y ofertas exclusivas
          de Agape
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Ingresa tu correo electrónico"
            className="bg-white"
          />
          <button className="bg-stone-800 hover:bg-stone-900 text-white py-2 px-4 rounded">
            Subscribir
          </button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const history = useRouter();

  return (
    <footer className="bg-stone-800 text-stone-300 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-semibold mb-2">Papelería Agape</h3>
            <p>Elaborando historias desde 2023</p>
            <span
              className="cursor-pointer"
              onClick={() => history.push("/cms/")}
            >
              Cms
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Mail className="w-6 h-6" />
            <span>contact@agapestationery.com</span>
          </div>
        </div>
        <div className="mt-8 text-center text-sm">
          <p>
            &copy; Papelería Ágape {new Date().getFullYear()}. Todos los
            derechos reservados
          </p>
        </div>
      </div>
    </footer>
  );
}
