# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

# Entorno de Prueba Local – Agape App

Este repositorio provee un **entorno de prueba local** con PostgreSQL, PgAdmin, Azurite, Redis y tu aplicación (`agape-app`).

```yml
version: "3.8"

services:
  db:
    image: postgres:14
    container_name: db-agape-dev
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD: "mypassword"
    ports:
      - "5432:5432"
    volumes:
      - db-data:/var/lib/postgresql/data

  azurite:
    image: mcr.microsoft.com/azure-storage/azurite
    container_name: azurite-dev
    restart: unless-stopped
    command: >
      azurite-blob
      --blobHost 0.0.0.0
      --blobPort 10000
      --location /data
    ports:
      - "10000:10000"  # Blob
      - "10001:10001"  # Queue (opcional)
      - "10002:10002"  # Table (opcional)
    volumes:
      - azurite-data:/data

  redis:
    image: redis:7-alpine
    container_name: redis-dev
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  agape-app:
    image: agape-app:latest
    container_name: agape-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URI: "postgresql://postgres:mypassword@db"
      AZURE_CONNECTION_STRING: >
        DefaultEndpointsProtocol=http;
        AccountName=devstoreaccount1;
        AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/
        K1SZFPTOtr/KBHBeksoGMGw==;
        BlobEndpoint=http://azurite:10000/devstoreaccount1;
        QueueEndpoint=http://azurite:10001/devstoreaccount1;
        TableEndpoint=http://azurite:10002/devstoreaccount1;
    depends_on:
      - db
      - azurite
      - redis

volumes:
  db-data:
  azurite-data:
  redis-data:
```