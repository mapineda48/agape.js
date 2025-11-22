# agape.js

**agape.js** es una aplicación web Full Stack moderna y robusta, construida íntegramente con **TypeScript**. Este proyecto está diseñado para ofrecer una experiencia de desarrollo fluida y un rendimiento de producción optimizado, integrando las mejores prácticas y herramientas del ecosistema actual.

## 🚀 Stack Tecnológico

### Frontend (Interfaz de Usuario)
*   **React**: Librería principal para la construcción de interfaces dinámicas.
*   **Vite**: Empaquetador de última generación que ofrece un servidor de desarrollo extremadamente rápido (HMR).
*   **TailwindCSS**: Framework de utilidad para un diseño rápido, responsivo y moderno.
*   **Redux Toolkit**: Gestión eficiente y predecible del estado global de la aplicación.
*   **Framer Motion**: Librería potente para crear animaciones fluidas y complejas.

### Backend (Servidor y API)
*   **Express**: Framework web minimalista y flexible para Node.js.
*   **Drizzle ORM**: ORM moderno y ligero para interactuar con la base de datos de forma segura y tipada.
*   **PostgreSQL**: Sistema de gestión de bases de datos relacional robusto y confiable.
*   **Redis**: Almacenamiento en memoria para caché de alto rendimiento y gestión de sesiones.
*   **Seguridad**: Implementación de autenticación segura mediante **JWT** (JSON Web Tokens) y **Bcrypt** para el hashing de contraseñas.

### Infraestructura y Servicios
*   **Docker**: Contenerización completa del entorno (Base de datos, Redis, App) para un despliegue consistente.
*   **Azure Storage Blob**: Almacenamiento escalable de objetos en la nube para archivos y medios.
*   **SendGrid**: Servicio confiable para el envío transaccional de correos electrónicos.

## 📂 Estructura del Proyecto

El proyecto sigue una arquitectura monorepo ligera para mantener el código organizado y modular:

*   **`web/`**: Código fuente del Frontend (React). Aquí viven los componentes, páginas y lógica de cliente.
*   **`svc/`** (Services): Lógica de negocio del Backend. Cada archivo aquí puede convertirse automáticamente en un endpoint API.
*   **`models/`**: Definiciones de esquemas de base de datos utilizando Drizzle ORM.
*   **`bin/`**: Puntos de entrada ejecutables del servidor (ej. `index.ts` para iniciar el backend).
*   **`lib/`**: Librerías compartidas, utilidades y configuraciones comunes.

## ⚡ Sistema RPC (Remote Procedure Call)

Una de las características más potentes de **agape.js** es su sistema de **RPC personalizado**, que elimina la necesidad de gestionar manualmente rutas REST y peticiones HTTP repetitivas.

### ¿Cómo funciona?

El sistema permite llamar a funciones del backend directamente desde el frontend como si fueran funciones locales, manteniendo el tipado estático de TypeScript.

1.  **Backend (Definición)**:
    Cualquier función exportada dentro de la carpeta `svc/` se convierte automáticamente en un endpoint accesible. Un middleware de Express escanea estos archivos y crea rutas para ellos.

2.  **Build Time (La Magia de Vite)**:
    Un **Plugin de Vite** personalizado intercepta las importaciones que comienzan con `@agape/svc`. En lugar de importar el código del servidor (que fallaría en el navegador), genera un "Módulo Virtual" al vuelo. Este módulo sustituye la función real por un cliente RPC.

3.  **Frontend (Consumo)**:
    Cuando importas y usas una función en React:
    ```typescript
    import { getUser } from "@agape/svc/users";
    // ...
    const user = await getUser(userId);
    ```
    El cliente RPC generado serializa los argumentos usando **MessagePack** (más eficiente que JSON y con soporte binario), envía una petición `POST` optimizada al servidor, y devuelve el resultado tipado.

Esto simplifica drásticamente el desarrollo, permitiéndote enfocarte en la lógica de negocio en lugar de en la infraestructura de red.

## 🛠️ Comandos Principales

*   **`npm run dev`**: Inicia el servidor de desarrollo del frontend.
*   **`npm run backend`**: Ejecuta las migraciones de base de datos y levanta el servidor backend en modo desarrollo.
*   **`npm run build`**: Compila tanto el frontend como el backend para producción.
*   **`docker compose up`**: Levanta toda la infraestructura necesaria (PostgreSQL, Redis) en contenedores Docker.
