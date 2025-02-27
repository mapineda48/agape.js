import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { login, logout } from "@agape/access";
import { sayHelloWorld } from "@agape/public";
import Form, { Props } from "@client/components/form";
import Input from "@client/components/form/Input";
import Head from "next/head";

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

export function LoginForm() {
  const [state, setState] = useState(false);
  const loading = useCallback(() => setState((state) => !state), []);
  const router = useRouter();

  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h2>
        <Form
          onSubmit={(obj) => {
            loading();

            return login(obj.username, obj.password)
              .then(() => router.replace("/cms"))
              .catch(console.error)
              .finally(loading);
          }}
        >
          {/* Campo de Correo Electrónico */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="email">
              Usuario
            </label>
            <Input.Text
              id="username"
              name="username"
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
              name="password"
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              placeholder="********"
            />
          </div>
          {/* Botón de Envío */}
          <button
            disabled={state}
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200"
          >
            Iniciar Sesión
          </button>
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
