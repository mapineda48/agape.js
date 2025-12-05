import rpc from "@/utils/rpc";

export let session = null;

export const login = (() => {
  const login = rpc("/security/access/login");

  return (...args) => login(...args).then((state) => (session = state));
})();

export const logout = (() => {
  const logout = rpc("/security/access/logout");

  return (...args) => logout(...args).then((res) => (session = null));
})();

export async function isAuthenticated() {
  if (session) {
    return Promise.resolve(session);
  }

  const isAuthenticated = rpc("/security/access/isAuthenticated");

  try {
    session = await isAuthenticated();
    return session;
  } catch {
    return {};
  }
}
