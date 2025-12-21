import React, { useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";

/**
 * This layout becomes the root for all CMS pages.
 * It ignores the app root layout (CartProvider) since CMS doesn't need cart functionality.
 */
export const root = true;

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Cuando cambie `children`, scrollea el <main> al top
    if (mainRef.current) {
      console.log("scrolling to top");
      smoothScrollTo(mainRef.current, 0);
    }
  }, [children]); // 👈 Dependencia: cada vez que children cambia

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Modern Sidebar */}
      <Sidebar />

      {/* Main Content - Importante no se debe estableces estilos aqui para las paginas, cada una es reposanble de sus maquetación en caso de ser necesario estilos en comun se debe establecer un componente en comun para esto */}
      <main
        ref={mainRef}
        className="flex-1 relative z-0 overflow-y-auto focus:outline-none"
      >
        {children}
      </main>
    </div>
  );
}

function smoothScrollTo(element: HTMLElement, target: number, duration = 400) {
  const start = element.scrollTop;
  const distance = target - start;
  const startTime = performance.now();

  function animate(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);

    element.scrollTop = start + distance * eased;

    if (progress < 1) requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}
