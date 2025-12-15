# Sistema de Modales

Este documento describe la arquitectura del sistema de modales del proyecto, basado en un **Portal System** que gestiona automáticamente el z-index, scroll lock, y renderizado en el body del documento.

## Índice

- [Arquitectura General](#arquitectura-general)
- [Componentes Disponibles](#componentes-disponibles)
- [Uso Básico](#uso-básico)
- [Creando un Modal Personalizado](#creando-un-modal-personalizado)
- [Modal de Confirmación](#modal-de-confirmación)
- [Props del Modal](#props-del-modal)
- [Compound Components](#compound-components)
- [Modales Anidados](#modales-anidados)
- [Buenas Prácticas](#buenas-prácticas)
- [Troubleshooting](#troubleshooting)

---

## Arquitectura General

El sistema de modales se compone de tres capas:

```
┌─────────────────────────────────────────────────────────────┐
│                    PortalProvider                            │
│   (Gestiona el estado global de modales, scroll lock,       │
│    y asigna z-index automáticamente)                        │
├─────────────────────────────────────────────────────────────┤
│                    PortalModal                               │
│   (Wrapper que integra Modal con el sistema de Portal)      │
├─────────────────────────────────────────────────────────────┤
│                      Modal                                   │
│   (Componente base con animaciones y estilos)               │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Datos

1. El **PortalProvider** envuelve la aplicación y provee el contexto
2. **createPortalHook** crea hooks personalizados para abrir modales
3. Al llamar al hook, se "spawns" el modal en el body via **PortalRenderer**
4. Cada modal recibe un `zIndex` incremental automático (1500, 1600, 1700...)
5. Al cerrar, la animación de salida se ejecuta y luego se remueve del DOM

---

## Componentes Disponibles

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| `Modal` | `@/components/ui/Modal` | Componente base de modal |
| `PortalModal` | `@/components/ui/PortalModal` | Wrapper para usar con Portal |
| `useConfirmModal` | `@/components/ui/PortalConfirm` | Hook para modales de confirmación |
| `createPortalHook` | `@/components/util/portal` | Factory para crear hooks de modales |

---

## Uso Básico

### Paso 1: Crear el Modal Wrapper

```tsx
import { createPortalHook, type PortalInjectedProps } from "@/components/util/portal";
import PortalModal from "@/components/ui/PortalModal";

// Props específicas de tu modal
interface MyModalProps {
  itemId: number;
  onSave: () => void;
}

// El wrapper recibe PortalInjectedProps + tus props
function MyModalWrapper(props: MyModalProps & PortalInjectedProps) {
  return (
    <PortalModal {...props} title="Mi Modal" size="md">
      <MyModalContent 
        itemId={props.itemId}
        onSave={props.onSave}
        // onClose se inyecta automáticamente por PortalModal
      />
    </PortalModal>
  );
}

// Crear el hook
const useMyModal = createPortalHook(MyModalWrapper);
```

### Paso 2: Usar el Hook

```tsx
export default function MyPage() {
  const showMyModal = useMyModal();

  const handleOpenModal = () => {
    showMyModal({
      itemId: 123,
      onSave: () => {
        console.log("Guardado!");
      },
    });
  };

  return (
    <button onClick={handleOpenModal}>
      Abrir Modal
    </button>
  );
}
```

---

## Creando un Modal Personalizado

### Ejemplo Completo: Modal de Edición

```tsx
import { createPortalHook, type PortalInjectedProps } from "@/components/util/portal";
import PortalModal from "@/components/ui/PortalModal";
import Modal from "@/components/ui/Modal";
import { Form } from "@/components/form";
import Submit from "@/components/ui/submit";

interface EditUserProps {
  user: { id: number; name: string; email: string };
  onSave: () => void;
}

interface EditUserFormState {
  name: string;
  email: string;
}

// Contenido del formulario (recibe onClose inyectado)
function EditUserForm({ 
  user, 
  onSave, 
  onClose 
}: EditUserProps & { onClose?: () => void }) {
  
  const initialState: EditUserFormState = {
    name: user.name,
    email: user.email,
  };

  return (
    <Form.Root<EditUserFormState> state={initialState}>
      {/* Body con scroll automático */}
      <Modal.Body>
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Nombre</span>
            <Form.Text 
              path="name" 
              className="mt-1 w-full rounded-lg border px-3 py-2" 
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <Form.Text 
              path="email" 
              type="email"
              className="mt-1 w-full rounded-lg border px-3 py-2" 
            />
          </label>
        </div>
      </Modal.Body>

      {/* Footer con botones */}
      <div className="border-t bg-gray-50 px-6 py-4">
        <Modal.Footer>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancelar
          </button>
          <Submit<EditUserFormState>
            onSubmit={async (data) => {
              await updateUser(user.id, data);
              onSave();
              onClose?.();
            }}
            className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
          >
            Guardar
          </Submit>
        </Modal.Footer>
      </div>
    </Form.Root>
  );
}

// Wrapper del modal
function EditUserModalWrapper(props: EditUserProps & PortalInjectedProps) {
  return (
    <PortalModal 
      {...props} 
      title={`Editar: ${props.user.name}`}
      size="md"
    >
      <EditUserForm user={props.user} onSave={props.onSave} />
    </PortalModal>
  );
}

// Exportar el hook
export const useEditUserModal = createPortalHook(EditUserModalWrapper);
```

### Uso del Modal de Edición

```tsx
function UsersPage() {
  const showEditUser = useEditUserModal();

  const handleEdit = (user: User) => {
    showEditUser({
      user,
      onSave: () => {
        // Recargar lista de usuarios
        loadUsers();
      },
    });
  };

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          {user.name}
          <button onClick={() => handleEdit(user)}>Editar</button>
        </li>
      ))}
    </ul>
  );
}
```

---

## Modal de Confirmación

Para confirmaciones simples, usa el hook `useConfirmModal`:

```tsx
import { useConfirmModal } from "@/components/ui/PortalConfirm";

function DeleteButton({ item, onDeleted }: Props) {
  const showConfirm = useConfirmModal();

  const handleDelete = () => {
    showConfirm({
      title: "Eliminar elemento",
      message: `¿Estás seguro de eliminar "${item.name}"? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      variant: "danger", // "danger" | "primary"
      onConfirm: async () => {
        await deleteItem(item.id);
        onDeleted();
      },
    });
  };

  return (
    <button onClick={handleDelete} className="text-red-600">
      Eliminar
    </button>
  );
}
```

---

## Props del Modal

### PortalModal Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `title` | `ReactNode` | - | Título simple del modal |
| `header` | `ReactNode` | - | Contenido personalizado del header (reemplaza title) |
| `hideCloseButton` | `boolean` | `false` | Oculta el botón X de cerrar |
| `footer` | `ReactNode` | - | Contenido del footer (fuera del scroll) |
| `size` | `"sm" \| "md" \| "lg" \| "xl" \| "2xl" \| "full"` | `"md"` | Tamaño del modal |
| `className` | `string` | - | Clases adicionales para el panel |
| `bodyClassName` | `string` | - | Clases para el área de contenido |
| `maxBodyHeight` | `string` | `"70vh"` | Altura máxima del body (activa scroll) |
| `onClose` | `() => void` | - | Callback al cerrar el modal |

### Props Heredadas de Portal

Estas props se inyectan automáticamente:

| Prop | Tipo | Descripción |
|------|------|-------------|
| `zIndex` | `number` | Z-index asignado (1500, 1600, ...) |
| `remove` | `() => void` | Función para remover el modal del DOM |
| `style` | `CSSProperties` | Estilos con zIndex incluido |

---

## Compound Components

El Modal incluye subcomponentes para estructurar el contenido:

### Modal.Body

Wrapper con padding estándar para el contenido principal:

```tsx
<Modal.Body className="space-y-4">
  <p>Contenido del modal con padding 6/5</p>
</Modal.Body>
```

### Modal.Footer

Contenedor flex para botones de acción:

```tsx
<Modal.Footer>
  <button onClick={onClose}>Cancelar</button>
  <button onClick={onSave}>Guardar</button>
</Modal.Footer>
```

### Ejemplo de Estructura Completa

```tsx
<PortalModal {...props} title="Mi Modal">
  <Modal.Body>
    {/* Contenido scrolleable */}
    <p>Formulario o información...</p>
  </Modal.Body>
  
  {/* Este footer está FUERA del PortalModal, */}
  {/* usa la prop footer para footer integrado */}
</PortalModal>

{/* O con footer integrado: */}
<PortalModal 
  {...props} 
  title="Mi Modal"
  footer={
    <Modal.Footer>
      <button>Cancelar</button>
      <button>Guardar</button>
    </Modal.Footer>
  }
>
  <Modal.Body>
    <p>Contenido...</p>
  </Modal.Body>
</PortalModal>
```

---

## Modales Anidados

El sistema soporta modales anidados automáticamente:

```tsx
function ParentModal(props: ParentProps & PortalInjectedProps) {
  const showChildModal = useChildModal();

  return (
    <PortalModal {...props} title="Modal Padre" size="lg">
      <Modal.Body>
        <p>Contenido del modal padre</p>
        <button 
          onClick={() => showChildModal({ data: "..." })}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Abrir Modal Hijo
        </button>
      </Modal.Body>
    </PortalModal>
  );
}
```

### Cómo Funciona el Z-Index

1. Primer modal: `zIndex: 1500`
2. Segundo modal: `zIndex: 1600`
3. Tercer modal: `zIndex: 1700`
4. ...

Cada modal nuevo se posiciona 100 unidades por encima del anterior.

---

## Buenas Prácticas

### ✅ Hacer

```tsx
// 1. Definir el wrapper cerca de donde se usa
function MyModalWrapper(props: MyProps & PortalInjectedProps) {
  return (
    <PortalModal {...props} title="...">
      <MyContent />
    </PortalModal>
  );
}
const useMyModal = createPortalHook(MyModalWrapper);

// 2. Pasar callbacks para acciones post-cierre
showModal({
  data: item,
  onSave: () => reloadData(), // ✅ Callback para actualizar datos
});

// 3. Usar onClose inyectado para cerrar desde el contenido
function MyContent({ onClose }: { onClose?: () => void }) {
  return (
    <button onClick={onClose}>Cerrar</button> // ✅ Cierra con animación
  );
}
```

### ❌ Evitar

```tsx
// NO importar Modal directamente para crear modales
import Modal from "@/components/ui/Modal";
// ❌ <Modal isOpen={...} /> // No usar así

// NO manejar estado isOpen manualmente
const [isOpen, setIsOpen] = useState(false); // ❌

// NO llamar remove() directamente (usa onClose)
props.remove(); // ❌ Salta la animación de salida
```

---

## Troubleshooting

### Error: "Portal Context not found"

**Causa:** El componente no está dentro del `PortalProvider`.

**Solución:** Asegúrate de que `PortalProvider` envuelve tu aplicación:

```tsx
// App.tsx o similar
import PortalProvider from "@/components/util/portal";

function App() {
  return (
    <PortalProvider>
      <YourApp />
    </PortalProvider>
  );
}
```

### El modal no cierra con animación

**Causa:** Estás llamando `remove()` directamente.

**Solución:** Usa `onClose()` que se inyecta al contenido:

```tsx
// ❌ Malo
<button onClick={() => props.remove()}>Cerrar</button>

// ✅ Bueno
<button onClick={onClose}>Cerrar</button>
```

### El z-index no funciona en modales anidados

**Causa:** El modal hijo no usa el sistema de Portal.

**Solución:** Crea un hook con `createPortalHook` para el modal hijo:

```tsx
const useChildModal = createPortalHook(ChildModalWrapper);

// En el modal padre:
const showChild = useChildModal();
showChild({ ... }); // ✅ Usará z-index automático
```

### El scroll del body no se bloquea

**Causa:** Múltiples PortalProviders o configuración incorrecta.

**Solución:** Verifica que solo hay un `PortalProvider` en el root de la app.

---

## Checklist para Nuevos Modales

- [ ] Crear componente de contenido que recibe `onClose?: () => void`
- [ ] Crear wrapper que extiende `PortalInjectedProps`
- [ ] Usar `PortalModal` en el wrapper, pasando `{...props}`
- [ ] Crear hook con `createPortalHook(Wrapper)`
- [ ] Exportar el hook para uso en otros componentes
- [ ] Usar `Modal.Body` para contenido con padding
- [ ] Usar `Modal.Footer` para botones de acción
- [ ] Probar apertura/cierre con animación
- [ ] Probar modales anidados si aplica
