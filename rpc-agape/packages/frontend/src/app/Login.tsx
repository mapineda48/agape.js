import Form from "components/Form";
import Submit from "components/Form/Submit";
import Input from "components/Form/Input";
import { user, login, logout } from "backend/service/auth";
import { useRouter } from "router";
import { Fragment, ReactNode, useCallback, useEffect } from "react";
import { useEmitter } from "components/EventEmitter";

export default function Login({ redirectTo }: Props) {
  const app = useRouter();
  const emitter = useEmitter();

  useEffect(() => {
    if (user.id) {
      app.replace(redirectTo ?? "/cms/");
      return;
    }

    return emitter.on("LoginComplete", (data: unknown) => {
      app.replace(redirectTo ?? "/cms/");
    });
  }, [app, emitter, redirectTo]);

  if (user.id) {
    return null;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img
          alt="Your Company"
          src="https://tailwindui.com/plus/img/logos/mark.svg?color=indigo&shade=600"
          className="mx-auto h-10 w-auto"
        />
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <Form
          onSubmit={async (payload) => {
            await login(payload);
            emitter.emit("LoginComplete");
          }}
          className="space-y-6"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm/6 font-medium text-gray-900"
            >
              Email address
            </label>
            <div className="mt-2">
              <Input.Text
                name="username"
                required
                autoComplete="email"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm/6 font-medium text-gray-900"
              >
                Password
              </label>
              <div className="text-sm">
                <a
                  href="#"
                  className="font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Forgot password?
                </a>
              </div>
            </div>
            <div className="mt-2">
              <Input.Text
                password
                name="password"
                required
                autoComplete="current-password"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
              />
            </div>
          </div>

          <div>
            <Submit className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
              Sign in
            </Submit>
          </div>
        </Form>

        <p
          className="mt-10 text-center text-sm/6 text-gray-500 cursor-pointer"
          onClick={() => app.replace("/")}
        >
          Not a member?
        </p>
      </div>
    </div>
  );
}

export function Protected(props: { children: ReactNode }) {
  const app = useRouter();

  useEffect(() => {
    if (!user.id) {
      app.replace("/login", { redirectTo: app.pathname });
      return;
    }
  }, [app]);

  if (!user.id) {
    return null;
  }

  return <Fragment>{props.children}</Fragment>;
}

const LogOutEvent = Symbol();

export function useLogOut() {
  const app = useRouter();
  const emitter = useEmitter();

  useEffect(() =>
    emitter.on(LogOutEvent, () => {
      app.replace("/login");
    })
  );

  return useCallback(() => {
    logout().then((res) => {
      emitter.emit(LogOutEvent, res);
    });
  }, [emitter]);
}

/**
 * Types
 */
export interface Props {
  redirectTo: string;
}
