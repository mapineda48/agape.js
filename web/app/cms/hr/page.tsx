import { useEffect } from "react";
import { useRouter } from "@/components/router/router-hook";

export default function HrDirect() {
  const { navigate } = useRouter();

  useEffect(() => {
    navigate("./employees");
  }, [navigate]);

  return null;
}
