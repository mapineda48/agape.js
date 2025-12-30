---
trigger: glob
globs: app/**/*.ts
---

# Backend Development Guidelines (App)

When creating or modifying backend services, controllers, or models, ensure compliance with the following documentation:

- **Services:** Follow the architecture and patterns defined in `docs/svc/services.md` for business logic and service implementation.
- **Backend Testing:** Consult `docs/svc/test.md` for standards regarding backend unit and integration testing.
- **DTOs:** Follow `docs/dto.md` for Data Transfer Objects shared between the backend (`app`) and frontend (`web`).
- **Models:** Refer to `docs/models.md` when defining or updating database models and schemas.