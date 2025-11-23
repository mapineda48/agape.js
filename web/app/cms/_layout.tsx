import React from "react";
import Sidebar from "@/components/Sidebar";

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Modern Sidebar */}
      <Sidebar />

      {/* Main Content - Importante no se debe estableces estilos aqui para las paginas, cada una es reposanble de sus maquetación en caso de ser necesario estilos en comun se debe establecer un componente en comun para esto */}
      <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
        {children}
      </main>
    </div>
  );
}
