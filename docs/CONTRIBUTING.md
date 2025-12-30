# Contributing Guidelines

Thank you for your interest in contributing to this project.

To keep the codebase consistent, maintainable, and accessible to an international team, **the following rules are mandatory**.

---

## Language & Naming Conventions

### Code Language

- **All source code MUST be written in English**
- This includes:
  - Variable names
  - Function and method names
  - Class and interface names
  - File and folder names
  - Database field names
  - Enum values

✅ Correct:
```ts
const documentNumber = getNextDocumentNumber();
````

❌ Incorrect:

```ts
const numeroDocumento = obtenerSiguienteNumero();
```

---

### Comments & Documentation

* **All comments MUST be written in English**
* This applies to:

  * Inline comments
  * Block comments
  * JSDoc / TSDoc
  * TODOs and FIXMEs
  * Error messages intended for developers

✅ Correct:

```ts
// Prevent race condition when generating the document number
```

❌ Incorrect:

```ts
// Evita la condición de carrera al generar el número
```

---

### Commit Messages (Recommended)

* Write commit messages in **English**
* Use clear, descriptive messages

Example:

```
fix: prevent duplicate document numbers under concurrency
```

---

## Why English?

* English is the **de facto standard** in software development
* Improves:

  * Code readability
  * Onboarding of new developers
  * Long-term maintainability
  * Collaboration with international teams

---

By contributing to this project, you agree to follow these guidelines.