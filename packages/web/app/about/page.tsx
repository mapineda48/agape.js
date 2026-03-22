import { useRouter } from "#web/utils/components/router/hook";

export default function About() {
  const router = useRouter();
  return (
    <div onClick={() => router.navigate("/")}>
      <h1>About</h1>
      <p>Welcome to the About page.</p>
    </div>
  );
}
