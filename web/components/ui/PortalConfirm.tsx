import { createPortalHook, type PortalInjectedProps } from "../util/portal";
import PortalModal from "./PortalModal";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

interface ConfirmProps {
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
}

function ConfirmContent({
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "primary",
}: ConfirmProps & { onClose?: () => void }) {
  return (
    <div className="p-6">
      <div className="flex items-start">
        {variant === "danger" && (
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
            <ExclamationTriangleIcon
              className="h-6 w-6 text-red-600 dark:text-red-400"
              aria-hidden="true"
            />
          </div>
        )}
        <div
          className={clsx(
            "mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left",
            variant !== "danger" && "w-full"
          )}
        >
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
            {title}
          </h3>
          <div className="mt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {message}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
        <button
          type="button"
          className={clsx(
            "inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm",
            variant === "danger"
              ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
              : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
          )}
          onClick={() => {
            onConfirm();
            if (onClose) onClose();
          }}
        >
          {confirmText}
        </button>
        <button
          type="button"
          className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
          onClick={onClose}
        >
          {cancelText}
        </button>
      </div>
    </div>
  );
}

function ConfirmDialogWrapper(props: ConfirmProps & PortalInjectedProps) {
  return (
    <PortalModal {...props} size="sm">
      <ConfirmContent {...props} />
    </PortalModal>
  );
}

export const useConfirmModal = createPortalHook(ConfirmDialogWrapper);
