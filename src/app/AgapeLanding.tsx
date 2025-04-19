import { router } from "./Router";


export default function AgapeLanding(props: { message: string }) {
  console.log(props);
  return (
    <div>
      {props.message ?? "Sin mensaje"}{" "}
      <button
        onClick={() => {
          router.navigateTo("/cms");
        }}
      >
        go to cms
      </button>
    </div>
  );
}
