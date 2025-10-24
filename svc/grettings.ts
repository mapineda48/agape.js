export async function sayHello(name: string) {
    return Promise.resolve(`Hello ${name}`);
}

export default async function sayFoo(name: string) {
    return Promise.resolve(`Hello ${name}`);
}

export async function sayBar(name: string) {
    return Promise.resolve(`Hello ${name}`);
}