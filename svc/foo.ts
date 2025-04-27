import session from "#session";

export default async function sayHello(fullName: string) {
    return Promise.resolve(`Hello ${fullName}!`)
}