import { sayHelloWorld } from "@agape/public";
import Form, { Props } from "@client/components/form";
import Input from "@client/components/form/Input";

export default function LoginForm() {
  return (
    <Form
      onSubmit={async (obj) => {
        console.log(obj);

        const message = await sayHelloWorld(obj.fullName);

        console.log(message);

        return Promise.resolve();
      }}
    >
      <Input.Text name="fullName" />
      <button type="submit">Enviar</button>
    </Form>
  );
}
