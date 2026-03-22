**Role:** Actúa como un Arquitecto de Software Senior especializado en Sistemas de Diseño y DX (Developer Experience).
**Contexto:** Estamos migrando un sistema de formularios ubicado en `@web/utils/components/form/`. La implementación actual está rota y es difícil de mantener. Necesitamos rediseñar la API por completo para que sea intuitiva, moderna y mantenible, siguiendo principios de composición y tipos fuertes.

**Tu Desafío:**

1. **Análisis de Intención:** Investiga el código actual para deducir qué problemas intentaba resolver (manejo de errores, validaciones asíncronas, campos dinámicos, etc.).
2. **Propuesta de Nueva API:** Diseña una interfaz que los desarrolladores "amen usar". Prioriza la legibilidad y la facilidad de integración.
3. **Estrategia Incremental:** vamos a hacer "big bang rewrite". Propón un camino donde podamos implementar de forma gradual y probando las pequeñás partes a medida que se implementan.

**Entregables Requeridos:**

#### 1. `TEST_PLAN.md` (Catálogo de Pruebas)

Crea un documento que liste de forma exhaustiva:

- **Regresiones:** Tests que la versión actual debería estar cumpliendo (casos de uso detectados).
- **Nuevos Escenarios:** Tests necesarios para garantizar la robustez de la nueva API (edge cases, accesibilidad, tipado).
- _Nota: Solo descripción lógica de los tests, no implementación de código._

#### 2. `ANALYSIS_AND_DESIGN.md` (Arquitectura)

Un análisis profundo que incluya:

- **Diagnóstico:** ¿Por qué falló la implementación actual?
- **Principios de Diseño:** Justificación de la nueva API (ej. ¿Por qué usar Render Props vs Compound Components vs Hooks?).
- **Especificación de la API:** Ejemplos de uso de la nueva interfaz.
- **Plan de Trabajo:** Pasos accionables para la migración incremental en este proyecto.

**Instrucciones adicionales:**

- Tómate tu tiempo para "pensar" antes de escribir.
- Prioriza la simplicidad sobre la abstracción excesiva.
- Ignora la implementación de tests unitarios por ahora, enfócate en la estructura de los archivos Markdown solicitados.

los markdown los entregas en este mismo directorio
