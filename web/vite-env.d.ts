/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV?: 'development' | 'production' | 'test';
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};
