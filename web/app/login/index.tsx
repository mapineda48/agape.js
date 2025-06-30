import { useEffect } from "react";
import { login, logout } from "@agape/access";
import Form, { useForm } from "@/components/form";
import Input from "@/components/form/Input";
import { useEvent } from "@/components/event-emiter";
import { router } from "../Router";
import { useNotificacion } from "@/components/ui/notification";

export function LogOut() {
  const notify = useNotificacion();

  return (
    <button
      onClick={() => {
        logout()
          .then(() => router.navigateTo("/login", { replace: true }))
          .catch((error) => {
            notify({
              payload: error,
            });
          })
      }}
    >
      Salir
    </button>
  );
}

export function IniciarSesion() {
  const [loading, setLoading] = useEvent(false);
  const form = useForm();
  const notify = useNotificacion();


  useEffect(() => {
    if (loading) {
      return;
    }

    return form.submit((state: any) => {
      setLoading(true);

      login(state.username, state.password)
        .then(() => router.navigateTo("/cms", { replace: true }))
        .catch((error) => {
          notify({
            payload: error,
          });
        })
        .finally(() => setLoading(false));
    });
  }, [loading, setLoading]);

  return (
    <button
      disabled={loading}
      style={loading ? { cursor: "progress" } : undefined}
      type="submit"
      className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200"
    >
      Iniciar Sesión
    </button>
  );
}

export default function LoginForm() {
  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h2>
        <Form>
          {/* Campo de Correo Electrónico */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="email">
              Usuario
            </label>
            <Input.Text
              id="username"
              path="username"
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              placeholder="username"
            />
          </div>
          {/* Campo de Contraseña */}
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="password">
              Contraseña
            </label>
            <Input.Text
              password
              id="password"
              path="password"
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              placeholder="********"
            />
          </div>
          {/* Botón de Envío */}
          <IniciarSesion />
          {/* Enlace de Registro */}
          <p className="mt-4 text-center text-gray-600">
            ¿No tienes una cuenta?
            <a href="#" className="text-blue-500 hover:underline">
              Regístrate aquí
            </a>
          </p>
        </Form>
      </div>
    </div>
  );
}
