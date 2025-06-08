import Decimal from "#lib/utils/data/Decimal";

export default function sayHello(name: string, decimal: Decimal) {
    console.log(decimal instanceof Decimal);
    console.log(decimal.add("0.3"));

    return Promise.resolve({ res: `Hello ${name}` });
}