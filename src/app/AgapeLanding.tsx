import { navigateTo } from "./history";


export default function AgapeLanding(props: { message: string }) {
  console.log(props);
  return (
    <div>
      {props.message ?? "Sin mensaje"}{" "}
      <button
        onClick={() => {
          navigateTo("/cms");
        }}
      >
        go to cms
      </button>
    </div>
  );
}
