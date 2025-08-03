# AgapeApp

Pendiente hacer la introduccion

# Tecnologias

Este proyecto utiliza las siguientes tecnologías principales:

- **Node.js:** Plataforma para el backend y ejecución de servicios.
- **Express.js:** Framework para la creación de APIs y servicios HTTP.
- **React:** Biblioteca para construir interfaces de usuario en el frontend.
- **Vite:** Herramienta de desarrollo y bundler para el frontend, con integración de módulos virtuales y HMR.
- **Docker Compose:** Orquestador de contenedores para desplegar la aplicación y servicios externos.
- **Base de datos:** Se utiliza **PostgreSQL** como sistema de gestión de base de datos relacional, desplegado como servicio externo mediante Docker Compose.
- **Almacenamiento:** El proyecto puede integrar almacenamiento externo (por ejemplo, volúmenes de Docker o servicios de almacenamiento en la nube como Azure Blob Storage).
- **RPC y Serialización:** La comunicación entre frontend y backend se realiza mediante una implementación interna de RPC basada en módulos virtuales y serialización eficiente con **msgpackr**.
- **ORM:** Se utiliza **Drizzle ORM** para la gestión y migración de datos.
- **Servicios externos:** El proyecto puede integrar otros servicios como sistemas de mensajería, autenticación, etc., gestionados vía Docker Compose.

## Dependencias clave

- **Backend:**
  - Vite
  - Heroicons, Lucide React, Framer Motion

  - msgpackr (serialización eficiente para RPC)
  - Implementación interna de módulos virtuales para RPC

- **Utilidades:**
  - Lodash, Date-fns, Decimal.js, Chalk, Formidable, Fs-extra, Glob

- **Desarrollo:**

# Integracion entre el backend y el frontend atraves de RPC con modulos virtuales mediante Vite

El core del proyecto está diseñado para facilitar la creación y exposición de servicios RPC de manera automática y eficiente. Su funcionamiento se basa en los siguientes principios:


- **Generación de módulos virtuales:** Por cada servicio detectado, el plugin genera un módulo virtual que expone funciones RPC accesibles desde el frontend. Esto permite consumir los endpoints de los servicios de forma sencilla y segura.


- **Recarga en caliente (HMR):** Cuando se modifica un archivo de servicio, el sistema actualiza automáticamente el módulo virtual correspondiente y notifica al frontend, permitiendo un desarrollo ágil y sin reinicios manuales.
- **Acceso desde el frontend:** Los módulos virtuales generados pueden ser importados directamente en el código del frontend usando el namespace especial (`@agape/servicio`). Cada función exportada corresponde a un endpoint RPC.

# Convenciones de Modelos y Servicios

Para mantener la escalabilidad y organización del proyecto, es fundamental definir primero los modelos de datos en la carpeta `models/`. Los modelos representan las tablas de la base de datos y deben agruparse por namespaces (por ejemplo, `models/cms/client.ts`, `models/inventory/product.ts`) para facilitar la gestión y futuras migraciones.
\n**Recomendación importante:** Los nombres de las columnas en las tablas de la base de datos deben estar siempre en inglés para mantener la consistencia y facilitar la integración con herramientas y librerías externas.

Esta estructura permite que las migraciones sean más sencillas y que el código sea más mantenible, evitando que los modelos queden en la raíz y promoviendo una organización clara por dominio o funcionalidad.

## Importante sobre Servicios y DTOs

**Los servicios RPC nunca deben exponer directamente los modelos del backend.** Siempre se deben utilizar clases DTO (Data Transfer Object) para la comunicación entre frontend y backend. Las funciones de los servicios deben retornar objetos DTO o recibirlos como parámetros. Para valores primitivos, pueden usarse directamente si no es necesario un DTO. Esto garantiza el desacoplamiento entre la lógica interna y la interfaz pública, mejorando la seguridad y mantenibilidad.

El flujo recomendado para agregar nuevas funcionalidades es:

1. Crear o actualizar el modelo correspondiente en `models/`.
2. Realizar la migración de la base de datos si es necesario.
3. Agregar el servicio RPC en la carpeta `svc/`, siguiendo la convención de administración bajo `svc/cms/` para funcionalidades protegidas.
4. Consumir el servicio desde el frontend mediante importación directa.

Ejemplo:

1. Definir el modelo en `models/cms/client.ts`.
2. Crear la migración para la tabla de clientes.
3. Agregar el servicio en `svc/cms/client.ts` exportando la función `registerClient`.
4. Importar y consumir el endpoint en el frontend desde `@agape/cms/client`.
**Ejemplo de estructura de servicio:**

```typescript
// svc/clientRegisterService.ts
export function registerClient(data) {
    // lógica de registro
}
```

**Ejemplo de consumo en el frontend:**

```typescript
import { registerClient } from '@agape/clientRegisterService';

registerClient({ nombre: 'Juan' });
```

Este enfoque permite escalar el proyecto fácilmente, agregando nuevos servicios simplemente creando archivos en la carpeta `svc` y exportando funciones.

# Pruebas

Para el despliegue en un ambiente de pruebas se recomienda hacerlo mediante de docker compose con la imagen disponble en docker hub