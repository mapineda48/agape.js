'use server'

import Decimal from "./utils/data/Decimal";

let serverCounter = 0

export async function getServerCounter() {
  return serverCounter
}

export async function updateServerCounter(change: number) {
  serverCounter += change
}

export async function sayHelloEncoded(payload: { message: string, file?: File, file2?: File, decimal?: Decimal }) {
  console.log(payload.decimal instanceof Decimal);
  console.log(new Decimal("10.5"));

  if (payload.file) {
    console.log(payload.file.name);
  }

  if (payload.file2) {
    console.log(payload.file2.name);
  }

  return { status: 'success', message: 'Completed', decimal: new Decimal('10.5') };
}