"use client";

import Form from "@/components/form";
import Input from "@/components/form/Input";
import { login, user } from "agape-backend/service/auth";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h2>
        <Form
          onSubmit={(payload) => {
            login(payload)
              .then(() => router.replace("/cms"))
              .catch(console.error);

            return Promise.resolve();
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
              placeholder="ejemplo@correo.com"
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
