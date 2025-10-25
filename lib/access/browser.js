import rpc from "@/app/rpc";

export let session = null;

export const login = (() => {
    const login = rpc("/access/login");

    return (...args) => login(...args).then((state) => (session = state));
})();

export const logout = (() => {
    const logout = rpc("/access/logout");

    return (...args) => logout(...args).then((res) => (session = null));
})();

export async function isAuthenticated() {
    if (session) {
        return Promise.resolve(session);
    }

    const isAuthenticated = rpc("/access/isAuthenticated");

    try {
        session = await isAuthenticated();
        return session;
    } catch {
        return {};
    }
}