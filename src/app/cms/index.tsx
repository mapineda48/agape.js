import { router } from "../Router";

export default function AgapeLanding() {
  return (
    <div>
      Welcome to CMS!!!{" "}
      <button
        onClick={() => {
          router.navigateTo("/");
        }}
      >
        go to cms
      </button>
    </div>
  );
}
