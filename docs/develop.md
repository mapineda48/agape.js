Claro, aquí tienes una propuesta para el archivo `README.md` (o `index.md`) que sirve como punto de entrada centralizado para la documentación técnica.

Está organizado lógicamente para que un desarrollador nuevo entienda primero la arquitectura de datos, luego el backend y finalmente el frontend.

---

# 📘 Documentación Técnica del Proyecto

Bienvenido a la documentación técnica del sistema. Este proyecto sigue una arquitectura estricta basada en **TypeScript**, separación de responsabilidades mediante **DTOs**, y patrones de diseño específicos tanto para el modelado de datos como para la gestión del estado en el frontend.

A continuación encontrarás las guías esenciales para trabajar en cada capa de la aplicación.

---

## 🏗️ Arquitectura y Datos

Antes de escribir código, es crucial entender cómo modelamos la información y cómo la comunicamos entre capas.

- **[Modelado de Base de Datos (SQL & CTI)](./models.md)**
  _Lectura obligatoria._ Explica cómo mapeamos la herencia de objetos (OOP) a tablas relacionales usando el patrón **Class Table Inheritance (CTI)**. Detalla los dominios principales (`catalogs`, `core`, `inventory`, etc.) y el concepto de "Item Master".

- **[Data Transfer Objects (DTOs)](./dto.md)**
  Define el contrato estricto entre el Backend (`svc`) y el Frontend (`web`). Explica dónde ubicar los tipos, reglas de dependencia (prohibido usar modelos de ORM en el frontend) y cómo compartir interfaces mediante `lib/utils`.

---

## ⚙️ Backend (Services)

Guías para el desarrollo y prueba de la lógica de negocio en `svc/`.

- **[Testing de Servicios (Integración)](./svc/test.md)**
  Nuestra filosofía de testing en el backend es única: **No usamos mocks de base de datos**. Aquí aprenderás a configurar tests de integración que levantan schemas de PostgreSQL efímeros, usan imports dinámicos y garantizan la integridad real de los datos.

---

## 🖥️ Frontend (Web)

El cliente es una aplicación React con una arquitectura de herramientas personalizada (Router y Forms) optimizada para aplicaciones embebidas y ERPs.

### Core

- **[Agape Router (Navegación)](./web/router.md)**
  Documentación del router basado en sistema de archivos (similar a Next.js App Router). Aprende sobre `page.tsx`, `_layout.tsx`, rutas dinámicas `[id]`, y el hook `useRouter`.
- **[Motor de Formularios (Forms)](./web/form.md)**
  Librería personalizada para manejo de estado de formularios complejos. Cubre el uso de `<Form>`, inputs tipados, `autoCleanup` para secciones condicionales y validación de tipos con TypeScript.

### Calidad

- **[Testing de Frontend (Unitario)](./web/test.md)**
  Guía para testear componentes de React usando Vitest y React Testing Library. Explica cómo mockear servicios del backend (usando alias), configurar los Providers necesarios (`EventEmitter`, `HistoryContext`) y manejar timers.

---

## 🚀 Resumen de Patrones Clave

| Capa      | Patrón Principal                       | Tecnología/Herramienta         |
| :-------- | :------------------------------------- | :----------------------------- |
| **DB**    | Class Table Inheritance                | PostgreSQL                     |
| **API**   | Strict DTOs                            | TypeScript Interfaces          |
| **Web**   | Controlled State / File-system Routing | React, Redux (interno), Vitest |
| **Tests** | Backend: Real DB / Frontend: Mocks     | Vitest                         |
