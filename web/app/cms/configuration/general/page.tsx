import { useEffect, useState } from "react";
import clsx from "clsx";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  listClientTypes,
  createClientType,
  updateClientType,
  deleteClientType,
} from "@agape/crm/client_type";
import Form from "@/components/form";
import * as Input from "@/components/form/Input";
import CheckBox from "@/components/form/CheckBox";
import Submit from "@/components/ui/submit";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface ClientType {
  id: number;
  name: string;
  disabled: boolean;
}

export default function GeneralConfigurationPage() {
  const [clientTypes, setClientTypes] = useState<ClientType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<ClientType | null>(null);
  const [deletingItem, setDeletingItem] = useState<ClientType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const isEditing = !!editingItem;

  // Load client types on mount
  useEffect(() => {
    loadClientTypes();
  }, []);

  async function loadClientTypes() {
    try {
      setLoading(true);
      const data = await listClientTypes();
      setClientTypes(data);
    } catch (error) {
      console.error("Error loading client types:", error);
    } finally {
      setLoading(false);
    }
  }

  function confirmDelete(item: ClientType) {
    setDeletingItem(item);
  }

  async function handleDelete() {
    if (!deletingItem) return;

    try {
      await deleteClientType(deletingItem.id);
      await loadClientTypes();
      setDeletingItem(null);
    } catch (error) {
      console.error("Error deleting client type:", error);
      alert("Error al eliminar el tipo de cliente");
    }
  }

  function openCreateModal() {
    setIsCreating(true);
    setEditingItem(null);
  }

  function openEditModal(item: ClientType) {
    setEditingItem(item);
    setIsCreating(false);
  }

  function closeModal() {
    setEditingItem(null);
    setIsCreating(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Tipos de Cliente
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gestiona los tipos de clientes del sistema
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nuevo Tipo
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Cargando tipos de cliente...
          </div>
        ) : clientTypes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay tipos de cliente creados
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {clientTypes.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={clsx(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          item.disabled
                            ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                            : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        )}
                      >
                        {item.disabled ? "Deshabilitado" : "Activo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(item)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4 transition-colors"
                        title="Editar"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => confirmDelete(item)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        title="Eliminar"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isCreating || !!editingItem}
        onClose={closeModal}
        title={isEditing ? "Editar Tipo de Cliente" : "Nuevo Tipo de Cliente"}
        size="md"
      >
        <ClientTypeForm
          item={editingItem}
          onClose={closeModal}
          onSave={loadClientTypes}
        />
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title="Eliminar Tipo de Cliente"
        message={`¿Estás seguro de que deseas eliminar el tipo de cliente "${deletingItem?.name}"? Esta acción no se puede deshacer.`}
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
  const isEditing = !!item;
  const initialState = item || { name: "", disabled: false };

  async function handleSubmit(data: { name: string; disabled: boolean }) {
    try {
      if (isEditing && item) {
        await updateClientType(item.id, data);
      } else {
        await createClientType(data);
      }
      await onSave();
      onClose();
    } catch (error) {
      console.error("Error saving client type:", error);
      alert("Error al guardar el tipo de cliente");
    }
  }

  return (
    <Form state={initialState}>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre
          </label>
          <Input.Text
            path="name"
            required
            placeholder="Ej: VIP, Mayorista, Retail"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex items-center">
          <CheckBox
            path="disabled"
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Deshabilitar este tipo de cliente
          </label>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
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
          {isEditing ? "Guardar Cambios" : "Crear Tipo"}
        </Submit>
      </div>
    </Form>
  );
}
