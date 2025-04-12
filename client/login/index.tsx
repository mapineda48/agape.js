
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { login, logout } from "@agape/access";
import Form, { useForm } from "@client/components/form";
import Input from "@client/components/form/Input";
import { useEmitter } from "@client/components/EventEmitter";

export function Logout() {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        logout()
          .then(() => router.replace("/login"))
          .catch(console.error);
      }}
    >
      Salir
    </button>
  );
}

export function IniciarSesion() {
  const emitter = useEmitter();
  const [state, setState] = useState(false);
  const router = useRouter();
  const form = useForm();

  useEffect(() => emitter.setLoading(setState), []);

  useEffect(() => {
    if (state) {
      return;
    }

    return form.submit((state: any) => {
      emitter.setLoading(true);

      login(state.username, state.password)
        .then(() => router.replace("/cms"))
        .catch(console.error)
        .finally(() => emitter.setLoading(false));
    });
  }, [state, form]);

  return (
    <button
      disabled={state}
      type="submit"
      className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200"
    >
      Iniciar Sesión
    </button>
  );
}

export function LoginForm() {
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
