---
trigger: glob
globs: "{lib,models,svc,bin}/**/*.ts"
---

# Backend Development Guidelines (App)

When creating or modifying backend services, controllers, or models, ensure compliance with the following documentation:

- **Contributing:** Follow the project standards in `docs/CONTRIBUTING.md`.
- **Services:** Follow the architecture and patterns defined in `docs/app/services.md` for business logic and service implementation.
- **Backend Testing:** Consult `docs/app/test.md` for standards regarding backend unit and integration testing.
- **DTOs:** Follow `docs/dto.md` for Data Transfer Objects shared between the backend (`app`) and frontend (`web`).
- **Models:** Refer to `docs/app/models.md` when defining or updating database models and schemas.
