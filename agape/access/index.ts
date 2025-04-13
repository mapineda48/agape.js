import session from ".././../lib/auth/session"

export async function login(username: string, password: string) {
    return Promise.resolve(``);
}

export async function logout() {
    return Promise.resolve();
}

export const user = session;