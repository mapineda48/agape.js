import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import Modal from "./Modal";
import clsx from "clsx";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "primary",
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      hideCloseButton
      footer={
        <Modal.Footer>
          <button
            type="button"
            className={clsx(
              "inline-flex justify-center rounded-lg px-4 py-2.5",
              "text-sm font-medium transition-all duration-200",
              "border border-gray-300 bg-white text-gray-700",
              "hover:bg-gray-50 active:bg-gray-100",
              "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200",
              "dark:hover:bg-gray-700 dark:active:bg-gray-600",
              "focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2",
              "dark:focus:ring-offset-gray-900"
            )}
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={clsx(
              "inline-flex justify-center rounded-lg px-4 py-2.5",
              "text-sm font-semibold text-white transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              "dark:focus:ring-offset-gray-900",
              variant === "danger"
                ? "bg-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-red-500"
                : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 focus:ring-indigo-500"
            )}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </Modal.Footer>
      }
    >
      <Modal.Body>
        <div className="flex items-start gap-4">
          {variant === "danger" && (
            <div
              className={clsx(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                "bg-red-100 dark:bg-red-900/30"
              )}
            >
              <ExclamationTriangleIcon
                className="h-6 w-6 text-red-600 dark:text-red-400"
                aria-hidden="true"
              />
            </div>
          )}
          <div className={clsx("flex-1", variant !== "danger" && "text-center")}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {message}
            </p>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}
