import rpc from "../rpc/call/browser.js";

export let user = { id: null };

export const login = (() => {
  const login = rpc("/service/auth/login");

  return (...args) => login(...args).then((state) => (user = state));
})();

export const logout = (() => {
  const logout = rpc("/service/auth/logout");

  return (...args) => logout(...args).then((res) => (user = {}));
})();

export const isAuthenticated = (() => {
  const isAuthenticated = rpc("/service/auth/isAuthenticated");

  return (...args) => isAuthenticated(...args).then((state) => (user = state));
})();
