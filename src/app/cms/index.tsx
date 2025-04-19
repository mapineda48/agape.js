import { navigateTo } from "../history";

export default function AgapeLanding() {
  return (
    <div>
      Welcome to CMS!!!{" "}
      <button
        onClick={() => {
          navigateTo("/");
        }}
      >
        go to cms
      </button>
    </div>
  );
}
