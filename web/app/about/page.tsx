import type Decimal from "#shared/data/Decimal";
import { useRouter } from "#web/utils/components/router/hook";

export default function About({ decimal }: { decimal: Decimal }) {
  const router = useRouter();
  return (
    <div onClick={() => router.navigate("/")}>About {decimal.toString()}</div>
  );
}
