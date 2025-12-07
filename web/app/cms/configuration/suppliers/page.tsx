import { useMemo, useState, useEffect } from "react";
import { useNotificacion } from "@/components/ui/notification";
import type { ReactNode } from "react";
import clsx from "clsx";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import {
  listSuppliers,
  upsertSupplier,
  deleteSupplier,
} from "@agape/purchasing/supplier";
import { listSupplierTypes } from "@agape/purchasing/supplier_type";
import { listDocumentTypes } from "@agape/core/documentType";
import { getUserByDocument } from "@agape/core/user";
import Form, { useFormReset } from "@/components/form";
import * as Input from "@/components/form/Input";
import useInput from "@/components/form/Input/useInput";
import * as Select from "@/components/form/Select";
import CheckBox from "@/components/form/CheckBox";
import Submit from "@/components/ui/submit";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DateTime from "@utils/data/DateTime";
import PathProvider from "@/components/form/paths";

interface SupplierType {
  id: number;
  name: string;
}

interface SupplierRow {
  id: number;
  personId?: number | null;
  companyId?: number | null;
  supplierTypeId: number;
  supplierTypeName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  legalName?: string | null;
  tradeName?: string | null;
  email: string;
  phone?: string | null;
  address?: string | null;
  birthdate?: DateTime | string | null;
  active: boolean;
  // Identity fields
  documentTypeId?: number | null;
  documentNumber?: string | null;
}

interface DocumentType {
  id: number;
  name: string;
  code: string;
  isEnabled: boolean;
  appliesToPerson: boolean;
  appliesToCompany: boolean;
}

export async function onInit() {
  const [supplierData, typeData, documentTypes] = await Promise.all([
    listSuppliers(),
    listSupplierTypes(),
    listDocumentTypes(),
  ]);

  return {
    suppliers: supplierData.suppliers,
    types: typeData,
    documentTypes: documentTypes,
  };
}

export default function SuppliersConfigurationPage(props: {
  suppliers: SupplierRow[];
  types: SupplierType[];
  documentTypes: DocumentType[];
}) {
  const notify = useNotificacion();
  const [suppliers, setSuppliers] = useState<SupplierRow[]>(props.suppliers);
  const [types, setTypes] = useState<SupplierType[]>(props.types);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>(
    props.documentTypes
  );
  const [loading, setLoading] = useState(false);
  const [modalSupplier, setModalSupplier] = useState<SupplierRow | null>(null);
  const [confirmSupplier, setConfirmSupplier] = useState<SupplierRow | null>(
    null
  );

  async function loadData() {
    try {
      setLoading(true);
      const [supplierData, typeData, docTypesData] = await Promise.all([
        listSuppliers(),
        listSupplierTypes(),
        listDocumentTypes(),
      ]);
      setSuppliers(supplierData.suppliers as any);
      setTypes(typeData);
      setDocumentTypes(docTypesData as any);
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setModalSupplier({} as any);
  }

  function openEdit(supplier: SupplierRow) {
    setModalSupplier(supplier);
  }

  function closeModal() {
    setModalSupplier(null);
  }

  function confirmDelete(supplier: SupplierRow) {
    setConfirmSupplier(supplier);
  }

  async function handleDelete() {
    if (!confirmSupplier) return;
    try {
      await deleteSupplier(confirmSupplier.id);
      await loadData();
      setConfirmSupplier(null);
    } catch (error: any) {
      notify({ payload: error });
    }
  }

  const activeSuppliers = useMemo(
    () => suppliers.filter((s) => s.active).length,
    [suppliers]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Proveedores
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 mt-1">
            Catálogo de proveedores
          </h1>
          <p className="text-sm text-gray-600 max-w-2xl">
            Crea, edita o desactiva proveedores. Se usan en órdenes de compra y
            negociaciones.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Activos" value={activeSuppliers} tone="green" />
          <Stat label="Total" value={suppliers.length} tone="indigo" />
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <PlusIcon className="w-5 h-5" />
            Nuevo proveedor
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Lista de proveedores
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Incluye datos de contacto y tipo asignado.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500">Cargando...</div>
        ) : suppliers.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            Aún no has registrado proveedores.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <Th>Proveedor</Th>
                  <Th>Contacto</Th>
                  <Th>Tipo</Th>
                  <Th>Estado</Th>
                  <Th align="right">Acciones</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {suppliers.map((supplier) => {
                  const isPerson = !!supplier.personId || !!supplier.firstName;
                  const name = isPerson
                    ? `${supplier.firstName} ${supplier.lastName}`
                    : supplier.legalName || supplier.tradeName || "N/A";
                  const subName =
                    !isPerson && supplier.tradeName !== name
                      ? supplier.tradeName
                      : null;

                  return (
                    <tr
                      key={supplier.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                    >
                      <Td>
                        <div className="flex items-center gap-3">
                          <div
                            className={clsx(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                              isPerson
                                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
                                : "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300"
                            )}
                          >
                            {isPerson ? (
                              <UserIcon className="h-5 w-5" />
                            ) : (
                              <BuildingOfficeIcon className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {name}
                            </div>
                            {subName && (
                              <div className="text-xs text-gray-500">
                                {subName}
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              ID {supplier.id}
                            </div>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {supplier.email}
                        </div>
                        {supplier.phone ? (
                          <div className="text-xs text-gray-500">
                            {supplier.phone}
                          </div>
                        ) : null}
                      </Td>
                      <Td>
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                          {supplier.supplierTypeName || "Sin tipo"}
                        </span>
                      </Td>
                      <Td>
                        <span
                          className={clsx(
                            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                            supplier.active
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                          )}
                        >
                          {supplier.active ? "Activo" : "Inactivo"}
                        </span>
                      </Td>
                      <Td align="right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(supplier)}
                            className="rounded-md p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-900/40 transition-colors"
                            title="Editar"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => confirmDelete(supplier)}
                            className="rounded-md p-2 text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/40 transition-colors"
                            title="Eliminar"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalSupplier !== null}
        onClose={closeModal}
        title={modalSupplier ? "Editar proveedor" : "Nuevo proveedor"}
        size="lg"
      >
        <SupplierForm
          supplier={modalSupplier}
          supplierTypes={types}
          documentTypes={documentTypes}
          onClose={closeModal}
          onSave={loadData}
        />
      </Modal>

      <ConfirmModal
        isOpen={!!confirmSupplier}
        onClose={() => setConfirmSupplier(null)}
        onConfirm={handleDelete}
        title="Eliminar proveedor"
        message={
          confirmSupplier
            ? `¿Deseas eliminar a ${
                confirmSupplier.firstName ||
                confirmSupplier.legalName ||
                "este proveedor"
              }?`
            : ""
        }
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
}

function SupplierForm({
  supplier,
  supplierTypes,
  documentTypes,
  onClose,
  onSave,
}: {
  supplier: SupplierRow | null;
  supplierTypes: SupplierType[];
  documentTypes: DocumentType[];
  onClose: () => void;
  onSave: () => void;
}) {
  /*
   * Logic to determine correct documentTypeId based on person/company rule.
   * "siempre intenta obtener cada uno ordenado de forma descendente con un take one"
   */
  const defaultType = supplierTypes[0]?.id ?? 0;
  const hasTypes = supplierTypes.length > 0;

  // Inference logic
  const isPerson = supplier
    ? !!supplier.personId || !!supplier.firstName
    : true;
  const initialType = isPerson ? "person" : "company";

  const birthdateValue = supplier?.birthdate
    ? new DateTime(new Date(supplier.birthdate as any))
    : new DateTime();

  /*
   * Logic to determine correct documentTypeId based on person/company rule.
   * "siempre intenta obtener cada uno ordenado de forma descendente con un take one"
   */
  const personDocTypeId = useMemo(() => {
    const list = documentTypes
      .filter((d) => d.appliesToPerson && d.isEnabled)
      .sort((a, b) => b.id - a.id);
    return list[0]?.id;
  }, [documentTypes]);

  const companyDocTypeId = useMemo(() => {
    const list = documentTypes
      .filter((d) => d.appliesToCompany && d.isEnabled)
      .sort((a, b) => b.id - a.id);
    return list[0]?.id;
  }, [documentTypes]);

  const initialState = {
    id: supplier?.id,
    supplierTypeId: supplier?.supplierTypeId ?? defaultType,
    active: supplier?.active ?? true,
    email: supplier?.email ?? "",
    phone: supplier?.phone ?? "",
    address: supplier?.address ?? "",
    type: initialType,
    documentNumber: supplier?.documentNumber ?? "",
    // Conditional initial data
    person:
      initialType === "person"
        ? {
            firstName: supplier?.firstName ?? "",
            lastName: supplier?.lastName ?? "",
            birthdate: birthdateValue,
          }
        : undefined,
    company:
      initialType === "company"
        ? {
            legalName: supplier?.legalName ?? "",
            tradeName: supplier?.tradeName ?? "",
          }
        : undefined,
  };

  return (
    <Form state={initialState}>
      <SupplierFormContent
        supplier={supplier}
        onClose={onClose}
        onSave={onSave}
        supplierTypes={supplierTypes}
        personDocTypeId={personDocTypeId}
        companyDocTypeId={companyDocTypeId}
        hasTypes={hasTypes}
      />
    </Form>
  );
}

function SupplierFormContent({
  supplier,
  onClose,
  onSave,
  supplierTypes,
  personDocTypeId,
  companyDocTypeId,
  hasTypes,
}: {
  supplier: SupplierRow | null;
  supplierTypes: SupplierType[];
  onClose: () => void;
  onSave: () => void;
  personDocTypeId: number;
  companyDocTypeId: number;
  hasTypes: boolean;
}) {
  const notify = useNotificacion();
  const { merge, setAt } = useFormReset();
  const isEditing = !!supplier?.id;

  const [type] = useInput("type");
  const [documentNumber] = useInput("documentNumber");

  useEffect(() => {
    const timeOutId = setTimeout(async () => {
      const targetDocTypeId =
        type === "person" ? personDocTypeId : companyDocTypeId;

      if (!documentNumber || !targetDocTypeId) return;

      try {
        const user = await getUserByDocument(targetDocTypeId, documentNumber);

        if (user) {
          // Preload common information using merge
          merge({
            email: user.email || undefined,
            phone: user.phone || undefined,
            address: user.address || undefined,
          });

          // Preload type-specific information using setAt
          if (type === "person" && user.person) {
            setAt(["person"], {
              firstName: user.person.firstName,
              lastName: user.person.lastName,
              birthdate: user.person.birthdate
                ? new DateTime(new Date(user.person.birthdate as any))
                : undefined,
            });
          }

          if (type === "company" && user.company) {
            setAt(["company"], {
              legalName: user.company.legalName,
              tradeName: user.company.tradeName,
            });
          }

          console.log("User found:", user);

          notify({
            payload: "Se ha cargado la información existente.",
            type: "success",
          });
        }
      } catch (error) {
        console.error("Error searching user:", error);
      }
    }, 500);

    return () => clearTimeout(timeOutId);
  }, [
    documentNumber,
    type,
    personDocTypeId,
    companyDocTypeId,
    merge,
    setAt,
    notify,
  ]);

  return (
    <>
      <div className="grid gap-6 p-6">
        {/* Type Switcher */}
        <TypeSwitcher />

        <Field label="Número de documento">
          <Input.Text
            path="documentNumber"
            required
            placeholder="CC o NIT sin dígito de verificación"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Common Fields */}
          <Field label="Correo electrónico">
            <Input.Text
              path="email"
              email
              required
              placeholder="contacto@ejemplo.com"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </Field>
          <Field label="Teléfono">
            <Input.Text
              path="phone"
              placeholder="+52 55 1234 5678"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </Field>

          {/* Conditional Fields */}
          <ConditionalFields />

          <Field label="Dirección" className="md:col-span-2">
            <Input.Text
              path="address"
              placeholder="Calle, número, ciudad"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </Field>

          <hr className="md:col-span-2 border-gray-200 dark:border-gray-700 my-2" />

          <Field label="Tipo de clasificación">
            <Select.Int
              path="supplierTypeId"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              disabled={!hasTypes}
            >
              {hasTypes ? (
                supplierTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))
              ) : (
                <option value="">Crea tipos en Configuración General</option>
              )}
            </Select.Int>
          </Field>
          <Field label="Estado">
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
              <CheckBox
                path="active"
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-800 dark:text-gray-200">
                Activo
              </span>
            </div>
          </Field>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 rounded-b-xl">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <Submit
          onSubmit={async (data) => {
            const isPersonType = data.type === "person";
            const targetDocTypeId = isPersonType
              ? personDocTypeId
              : companyDocTypeId;

            if (!targetDocTypeId) {
              notify({
                payload:
                  "No se encontró un tipo de documento válido para este tipo de proveedor.",
                type: "error",
              });
              return;
            }

            await upsertSupplier({
              id: data.id,
              supplierTypeId: Number(data.supplierTypeId),
              active: data.active,
              user: {
                email: data.email,
                phone: data.phone,
                address: data.address,
                documentNumber: data.documentNumber,
                documentTypeId: targetDocTypeId,
                ...(isPersonType
                  ? {
                      person: {
                        ...data.person,
                        id: supplier?.personId, // Keep existing ID if updating
                      },
                    }
                  : {
                      company: {
                        ...data.company,
                        id: supplier?.companyId, // Keep existing ID if updating
                      },
                    }),
              } as any, // Cast as any to satisfy compiler if types aren't perfectly aligned
            });

            onSave();
            onClose();
          }}
          className={clsx(
            "px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm",
            hasTypes
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-gray-400 cursor-not-allowed"
          )}
          disabled={!hasTypes}
        >
          {isEditing ? "Guardar cambios" : "Crear proveedor"}
        </Submit>
      </div>
    </>
  );
}

function TypeSwitcher() {
  const [type, setType] = useInput("type", "person");

  return (
    <div className="flex justify-center pb-4">
      <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
        <button
          type="button"
          onClick={() => setType("person")}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
            type === "person"
              ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
          )}
        >
          <UserIcon className="w-4 h-4" />
          Persona
        </button>
        <button
          type="button"
          onClick={() => setType("company")}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
            type === "company"
              ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
          )}
        >
          <BuildingOfficeIcon className="w-4 h-4" />
          Empresa
        </button>
      </div>
    </div>
  );
}

function ConditionalFields() {
  const [type] = useInput("type");

  if (type === "company") {
    // Company Fields
    return (
      <PathProvider value="company" autoCleanup>
        <Field label="Razón Social">
          <Input.Text
            path="legalName"
            required
            placeholder="Ej: Soluciones Tecnológicas S.A. de C.V."
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </Field>
        <Field label="Nombre Comercial">
          <Input.Text
            path="tradeName"
            placeholder="Ej: Soluciones Tech"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </Field>
      </PathProvider>
    );
  }

  // Person Fields
  return (
    <PathProvider value="person" autoCleanup>
      <Field label="Nombre">
        <Input.Text
          path="firstName"
          required
          placeholder="Ej: Juan"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </Field>
      <Field label="Apellido">
        <Input.Text
          path="lastName"
          required
          placeholder="Ej: Pérez"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </Field>
      <Field label="Fecha de nacimiento" className="md:col-span-2">
        <Input.DateTime
          path="birthdate"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </Field>
    </PathProvider>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "indigo" | "green";
}) {
  const tones: Record<"indigo" | "green", string> = {
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };
  return (
    <div
      className={clsx(
        "rounded-full px-4 py-2 text-sm font-semibold border",
        tones[tone]
      )}
    >
      {label}: {value}
    </div>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={clsx(
        "px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400",
        align === "right" ? "text-right" : "text-left"
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td
      className={clsx(
        "px-6 py-4 text-sm text-gray-800 dark:text-gray-200",
        align === "right" ? "text-right" : "text-left"
      )}
    >
      {children}
    </td>
  );
}

function Field({
  label,
  description,
  children,
  className,
}: {
  label: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={clsx("space-y-1.5", className)}>
      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
        {label}
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
