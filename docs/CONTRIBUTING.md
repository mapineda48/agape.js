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

## TypeScript Usage & Typing Standards

This project is **TypeScript-first**.

We are strongly committed to maintaining a **strict, explicit, and strongly-typed codebase**, following TypeScript best practices to ensure correctness, readability, and long-term maintainability.

---

### TypeScript Configuration

* The project uses **TypeScript in strict mode**
* All new code **MUST compile without type errors**
* Type safety must never be bypassed for convenience

---

### Strict Typing Rules

The following practices are **mandatory**:

* **No `any` usage**

  * `any` is forbidden unless there is a **documented and justified reason**
* Prefer:

  * `unknown` over `any`
  * explicit union types
  * generics with meaningful constraints

❌ Incorrect:

```ts
function process(data: any) {
  return data.value;
}
```

✅ Correct:

```ts
function process<T extends { value: string }>(data: T): string {
  return data.value;
}
```

---

### Explicit Types & Inference

* Type inference is encouraged **only when it improves clarity**
* Public APIs (services, DTOs, exported functions) **MUST have explicit types**

❌ Avoid:

```ts
export function createUser(data) {
  return repository.save(data);
}
```

✅ Preferred:

```ts
export function createUser(data: CreateUserDto): Promise<User> {
  return repository.save(data);
}
```

---

### Nullability & Safety

* Always handle:

  * `null`
  * `undefined`
* Never assume a value exists unless enforced by the type system

✅ Preferred:

```ts
if (!user) {
  throw new UserNotFoundError();
}
```

---

### Type Assertions

* Type assertions (`as`) should be **rare and justified**
* Never use assertions to silence the compiler

❌ Incorrect:

```ts
const user = data as User;
```

✅ Acceptable (with validation):

```ts
if (!isUser(data)) {
  throw new Error("Invalid user payload");
}
const user: User = data;
```

---

### DTOs & Shared Types

* All Data Transfer Objects must:

  * Be explicitly typed
  * Live in their designated DTO modules
  * Avoid leaking database or ORM-specific types
* Shared types between backend and frontend **must remain stable and versioned**

---

### Why This Matters

Strong typing is a **core design principle** of this project.
It allows us to:

* Prevent entire classes of runtime bugs
* Improve refactor safety
* Enforce domain boundaries
* Scale the codebase with confidence

---

By contributing to this project, you agree to follow these guidelines.