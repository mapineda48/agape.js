import { useEffect } from "react";
import Form, { Path, useArray, useForm } from "./components/form.v2";
import Input from "./components/form.v2/Input";

export default function TestForm() {
  return (
    <Form
      onSubmit={(payload) => {
        console.log(payload);
      }}
    >
      <Input.Text path="username" placeholder="username" />
      <Input.Text path="password" password placeholder="password" />
      <Path base="user">
        <Input.Text path="fullname" placeholder="fullname" />
        <Input.Int path="age" placeholder="age" />
        <Path base="user">
          <Input.Text path="fullname" placeholder="fullname" />
          <Input.Int path="age" placeholder="age" />
        </Path>
      </Path>
      <TestArray />
      <Submit />
    </Form>
  );
}

function TestArray() {
  const values = useArray<{ value: string }[]>("values");

  return (
    <div>
      {values.map(({ value }: any, index: number) => {
        console.log({
          value,
          index,
        });
        return (
          <div>
            <Input.Text
              path="value"
              placeholder={`Direccion ${index}`}
              value={value}
            />
            <button onClick={() => values.removeItem(index)}>X</button>
          </div>
        );
      })}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          values.addItem({
            value: "",
          });
        }}
      >
        Agregar Item
      </button>
    </div>
  );
}

function Submit() {
  const form = useForm<Payload>();

  useEffect(() => {
    form.merge({
      user: {
        fullname: "Miguel Pineda",
        age: 31,
      },
    });
  }, []);

  return <input type="submit" value="Enviar" />;
}

interface Payload {
  username: string;
  password: string;
  user: {
    fullname: string;
    age: number;
  };

  directions: string[];
}
