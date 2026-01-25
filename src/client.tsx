'use client'

import React from 'react'
import { sayHelloEncoded } from './action';
import Decimal from './utils/data/Decimal';

export function ClientCounter() {
  const [count, setCount] = React.useState(0)

  return (
    <button onClick={() => setCount((count) => count + 1)}>
      Client Counter: {count}
    </button>
  )
}


export function SayHelloEncoded() {
  const [file, setFile] = React.useState<File | undefined>(undefined);
  const [file2, setFile2] = React.useState<File | undefined>(undefined);

  return (
    <>
      <button onClick={() => {
        sayHelloEncoded({ message: 'Hello World', file, file2, decimal: new Decimal('10.5') }).then((res) => {
          console.log(res);
        }).catch((err) => {
          console.log(err);
        });
      }}>
        Say Hello Encoded
      </button>
      <input type="file" onChange={(e) => {
        const file = e.target.files?.[0];

        if (file) {
          setFile(file);
        }
      }} />
      <input type="file" onChange={(e) => {
        const file = e.target.files?.[0];

        if (file) {
          setFile2(file);
        }
      }} />
    </>
  )
}