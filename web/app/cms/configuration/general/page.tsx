import { useState } from "react";
import { useNotificacion } from "@/components/ui/notification";
import type { ReactNode } from "react";
import clsx from "clsx";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  listClientTypes,
  upsertClientType,
  deleteClientType,
} from "@agape/crm/clientType";
import {
  listSupplierTypes,
  createSupplierType,
  updateSupplierType,
  deleteSupplierType,
} from "@agape/purchasing/supplier_type";
import Form from "@/components/form";
import * as Input from "@/components/form/Input";
import CheckBox from "@/components/form/CheckBox";
import Submit from "@/components/ui/submit";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface ClientType {
  id: number;
  name: string;
  isEnabled: boolean;
}

interface SupplierType {
  id: number;
  name: string;
}

type ModalState =
  | { type: "client"; item: ClientType | null }
  | { type: "supplier"; item: SupplierType | null }
  | null;

type ConfirmState =
  | { type: "client"; item: ClientType }
  | { type: "supplier"; item: SupplierType }
  | null;

export async function onInit() {
  const [clientTypes, supplierTypes] = await Promise.all([
    listClientTypes(),
    listSupplierTypes(),
  ]);

  return {
    clientTypes,
    supplierTypes,
  };
}

export default function GeneralConfigurationPage(props: {
  clientTypes: ClientType[];
  supplierTypes: SupplierType[];
}) {
  const notify = useNotificacion();
  const [clientTypes, setClientTypes] = useState<ClientType[]>(
    props.clientTypes
  );
  const [supplierTypes, setSupplierTypes] = useState<SupplierType[]>(
    props.supplierTypes
  );
  const [loading, setLoading] = useState(false);
  const [modalState, setModalState] = useState<ModalState>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  async function reloadClients() {
    setLoading(true);
    const data = await listClientTypes();
    setClientTypes(data);
    setLoading(false);
  }

  async function reloadSuppliers() {
    setLoading(true);
    const data = await listSupplierTypes();
    setSupplierTypes(data);
    setLoading(false);
  }

  function openCreate(type: "client" | "supplier") {
    setModalState({ type, item: null });
  }

  function openEdit(type: "client", item: ClientType): void;
  function openEdit(type: "supplier", item: SupplierType): void;
  function openEdit(
    type: "client" | "supplier",
    item: ClientType | SupplierType
  ) {
    if (type === "client") {
      setModalState({ type, item: item as ClientType });
      return;
    }
    setModalState({ type: "supplier", item: item as SupplierType });
  }

  function closeModal() {
    setModalState(null);
  }

  function confirmDelete(
    type: "client" | "supplier",
    item: ClientType | SupplierType
  ) {
    if (type === "client") {
      setConfirmState({ type, item: item as ClientType });
      return;
    }
    setConfirmState({ type, item: item as SupplierType });
  }

  async function handleDelete() {
    if (!confirmState) return;

    try {
      if (confirmState.type === "client") {
        await deleteClientType(confirmState.item.id);
        await reloadClients();
      } else {
        await deleteSupplierType(confirmState.item.id);
        await reloadSuppliers();
      }
      setConfirmState(null);
    } catch (error) {
      console.error("Error deleting type:", error);
      notify({ payload: "Error al eliminar el registro", type: "error" });
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-r from-indigo-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">
              Configuración General
            </p>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
              Catálogos maestros de CRM y Compras
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-2xl">
              Administra los tipos de cliente y proveedor desde un mismo panel.
              Los cambios se reflejan en formularios y flujos de alta de manera
              inmediata.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatChip
              label="Tipos de cliente"
              value={clientTypes.length}
              tone="indigo"
              muted={loading}
            />
            <StatChip
              label="Tipos de proveedor"
              value={supplierTypes.length}
              tone="emerald"
              muted={loading}
            />
            <StatChip
              label="Clientes activos"
              value={clientTypes.filter((t) => t.isEnabled).length}
              tone="blue"
              muted={loading}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TypePanel
          title="Tipos de Cliente"
          description="Estados que se usan en formularios y embudos de CRM."
          tone="indigo"
          loading={loading}
          onCreate={() => openCreate("client")}
          isEmpty={clientTypes.length === 0}
          emptyMessage="Aún no has creado tipos de cliente."
        >
          <div className="space-y-3">
            {clientTypes.map((item) => (
              <RowCard
                key={item.id}
                title={item.name}
                subtitle={`ID ${item.id}`}
                badgeLabel={item.isEnabled ? "Activo" : "Deshabilitado"}
                badgeTone={item.isEnabled ? "green" : "red"}
                onEdit={() => openEdit("client", item)}
                onDelete={() => confirmDelete("client", item)}
              />
            ))}
          </div>
        </TypePanel>

        <TypePanel
          title="Tipos de Proveedor"
          description="Clasifica proveedores para compras y negociaciones."
          tone="emerald"
          loading={loading}
          onCreate={() => openCreate("supplier")}
          isEmpty={supplierTypes.length === 0}
          emptyMessage="Aún no has creado tipos de proveedor."
        >
          <div className="space-y-3">
            {supplierTypes.map((item) => (
              <RowCard
                key={item.id}
                title={item.name}
                subtitle={`ID ${item.id}`}
                badgeLabel="Catálogo"
                badgeTone="amber"
                onEdit={() => openEdit("supplier", item)}
                onDelete={() => confirmDelete("supplier", item)}
              />
            ))}
          </div>
        </TypePanel>
      </div>

      <Modal
        isOpen={!!modalState}
        onClose={closeModal}
        title={
          modalState?.type === "client"
            ? modalState.item
              ? "Editar tipo de cliente"
              : "Nuevo tipo de cliente"
            : modalState?.item
            ? "Editar tipo de proveedor"
            : "Nuevo tipo de proveedor"
        }
        size="md"
      >
        {modalState?.type === "client" ? (
          <ClientTypeForm
            item={modalState.item}
            onClose={closeModal}
            onSave={reloadClients}
          />
        ) : modalState?.type === "supplier" ? (
          <SupplierTypeForm
            item={modalState.item}
            onClose={closeModal}
            onSave={reloadSuppliers}
          />
        ) : null}
      </Modal>

      <ConfirmModal
        isOpen={!!confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={handleDelete}
        title={
          confirmState?.type === "client"
            ? "Eliminar tipo de cliente"
            : "Eliminar tipo de proveedor"
        }
        message={
          confirmState
            ? `¿Estás seguro de que deseas eliminar "${confirmState.item.name}"? Esta acción no se puede deshacer.`
            : ""
        }
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
}

interface ClientTypeFormProps {
  item: ClientType | null;
  onClose: () => void;
  onSave: () => void;
}

function ClientTypeForm({ item, onClose, onSave }: ClientTypeFormProps) {
  const notify = useNotificacion();
  const isEditing = !!item;
  const initialState = item || { name: "", isEnabled: false };

  async function handleSubmit(data: { name: string; isEnabled: boolean }) {
    try {
      if (isEditing && item) {
        await upsertClientType({ id: item.id, ...data });
      } else {
        await upsertClientType(data);
      }
      await onSave();
      onClose();
    } catch (error) {
      console.error("Error saving client type:", error);
      notify({ payload: "Error al guardar el tipo de cliente", type: "error" });
    }
  }

  return (
    <Form state={initialState}>
      <div className="p-6 space-y-5">
        <FieldLabel
          title="Nombre"
          description="Será visible en listados, formularios y reportes."
        >
          <Input.Text
            path="name"
            required
            placeholder="Ej: Mayorista, Retail, VIP"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </FieldLabel>

        <FieldLabel
          title="Estado"
          description="Solo los activos aparecerán como opción al crear clientes."
        >
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
            <CheckBox
              path="isEnabled"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-800 dark:text-gray-200">
              Activo
            </span>
          </div>
        </FieldLabel>
      </div>

      <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 rounded-b-xl">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <Submit
          onSubmit={handleSubmit}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm hover:shadow-md"
        >
          {isEditing ? "Guardar cambios" : "Crear tipo"}
        </Submit>
      </div>
    </Form>
  );
}

interface SupplierTypeFormProps {
  item: SupplierType | null;
  onClose: () => void;
  onSave: () => void;
}

function SupplierTypeForm({ item, onClose, onSave }: SupplierTypeFormProps) {
  const notify = useNotificacion();
  const isEditing = !!item;
  const initialState = item || { name: "" };

  async function handleSubmit(data: { name: string }) {
    try {
      if (isEditing && item) {
        await updateSupplierType(item.id, data);
      } else {
        await createSupplierType(data);
      }
      await onSave();
      onClose();
    } catch (error) {
      console.error("Error saving supplier type:", error);
      notify({
        payload: "Error al guardar el tipo de proveedor",
        type: "error",
      });
    }
  }

  return (
    <Form state={initialState}>
      <div className="p-6 space-y-5">
        <FieldLabel
          title="Nombre"
          description="Usa nombres cortos y claros; aparecerán en compras y órdenes."
        >
          <Input.Text
            path="name"
            required
            placeholder="Ej: Logística, Materias primas"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </FieldLabel>
      </div>

      <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 rounded-b-xl">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <Submit
          onSubmit={handleSubmit}
          className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm hover:shadow-md"
        >
          {isEditing ? "Guardar cambios" : "Crear tipo"}
        </Submit>
      </div>
    </Form>
  );
}

function TypePanel({
  title,
  description,
  tone,
  loading,
  onCreate,
  emptyMessage,
  isEmpty,
  children,
}: {
  title: string;
  description: string;
  tone: "indigo" | "emerald";
  loading: boolean;
  onCreate: () => void;
  emptyMessage: string;
  isEmpty: boolean;
  children: ReactNode;
}) {
  const accent =
    tone === "indigo"
      ? "from-indigo-50/70 dark:from-indigo-900/20"
      : "from-emerald-50/70 dark:from-emerald-900/20";

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
      <div
        className={clsx(
          "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 rounded-t-2xl bg-gradient-to-r to-transparent",
          accent
        )}
      >
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {description}
          </p>
        </div>
        <button
          onClick={onCreate}
          className={clsx(
            "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white shadow-sm transition-transform hover:-translate-y-0.5",
            tone === "indigo"
              ? "bg-indigo-600 hover:bg-indigo-700"
              : "bg-emerald-600 hover:bg-emerald-700"
          )}
        >
          <PlusIcon className="w-5 h-5" />
          Nuevo
        </button>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 px-4 py-8 text-center text-sm text-gray-600 dark:text-gray-300">
            Cargando datos...
          </div>
        ) : isEmpty ? (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 px-4 py-8 text-center text-sm text-gray-600 dark:text-gray-300">
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function RowCard({
  title,
  subtitle,
  badgeLabel,
  badgeTone,
  onEdit,
  onDelete,
}: {
  title: string;
  subtitle: string;
  badgeLabel: string;
  badgeTone: "green" | "red" | "amber";
  onEdit: () => void;
  onDelete: () => void;
}) {
  const badgeStyles: Record<"green" | "red" | "amber", string> = {
    green:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    amber:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={clsx(
            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
            badgeStyles[badgeTone]
          )}
        >
          {badgeLabel}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="rounded-md p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-900/40 transition-colors"
            title="Editar"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onDelete}
            className="rounded-md p-2 text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/40 transition-colors"
            title="Eliminar"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
        {title}
      </span>
      {description ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      ) : null}
      {children}
    </label>
  );
}

function StatChip({
  label,
  value,
  tone,
  muted,
}: {
  label: string;
  value: number;
  tone: "indigo" | "emerald" | "blue";
  muted?: boolean;
}) {
  const tones: Record<"indigo" | "emerald" | "blue", string> = {
    indigo:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
    emerald:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  };

  return (
    <div
      className={clsx(
        "rounded-full px-4 py-2 text-sm font-semibold shadow-sm border border-white/60 dark:border-gray-700",
        tones[tone],
        muted && "opacity-70"
      )}
    >
      {label}: {value}
    </div>
  );
}
