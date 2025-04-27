import rpc from "@agape/rpc";

export let session = null;

export const login = (() => {
  const login = rpc("/access/login");

  return (...args) => login(...args).then((state) => (session = state));
})();

export const logout = (() => {
  const logout = rpc("/access/logout");

  return (...args) => logout(...args).then((res) => (session = {}));
})();

export const isAuthenticated = (() => {
  const isAuthenticated = rpc("/access/isAuthenticated");

  return (...args) =>
    isAuthenticated(...args)
      .then((state) => (session = state))
      .catch((err) => {
        session = {};
        throw err;
      });
})();