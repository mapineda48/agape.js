import history from "../../history";

export default function AgapeLanding() {
  return (
    <div>
      Welcome to CMS!!!{" "}
      <button
        onClick={() => {
          history.push("/");
        }}
      >
        go to cms
      </button>
    </div>
  );
}
