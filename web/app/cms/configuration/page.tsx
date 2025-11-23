import { useEffect } from "react";
import router from "@/app/router";

export default function ConfigurationPage() {
  useEffect(() => {
    router.navigateTo("/cms/configuration/inventory", { replace: true });
  }, []);

  return null;
}
