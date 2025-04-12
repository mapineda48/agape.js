import { useEffect, useState } from "react";
import Form, { Path, useInputArray, useForm } from "./components/form";
import Input from "./components/form/Input";
import yieldToUI from "./components/util/yieldToUI";

export default function TestForm() {
  return (
    <Form>
      <Input.Text path="username" placeholder="username" />
      <Input.Text path="password" password placeholder="password" />
      <Path value="user">
        <Input.Text path="fullname" placeholder="fullname" />
        <Input.Int path="age" placeholder="age" />
        <Path value="user">
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
  const values = useInputArray<{ value: string }[]>("values");

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
  const [disabled, setLoading] = useState(false);
  const form = useForm<Payload>();

  useEffect(() => {
    form.merge({
      user: {
        fullname: "Miguel Pineda",
        age: 31,
      },
    });
  }, [form]);

  useEffect(() => {
    if (disabled) {
      return;
    }

    return form.submit(async (state) => {
      setLoading(true);
      await yieldToUI(5000);
      console.log(state);
      setLoading(false);
    });
  }, [disabled]);

  return <input disabled={disabled} type="submit" value={disabled ? "Cargando..." : "Enviar"} />;
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
