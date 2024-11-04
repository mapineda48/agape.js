import { useRouter } from "router";
import { getCategories } from "backend/service/public";

export default function Welcome() {
  const history = useRouter();

  return (
    <div
      onClick={() => {
        history.push("/login");
      }}
    >
      Welcome!!!
    </div>
  );
}
