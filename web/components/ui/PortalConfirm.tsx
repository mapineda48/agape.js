import { createPortalHook, type PortalInjectedProps } from "../util/portal";
import PortalModal from "./PortalModal";
import Modal from "./Modal";
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
  const handleConfirm = () => {
    onConfirm();
    if (onClose) onClose();
  };

  return (
    <>
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

      <div
        className={clsx(
          "shrink-0 border-t border-gray-200 dark:border-gray-700/50",
          "bg-gray-50/80 dark:bg-gray-800/50",
          "px-6 py-4"
        )}
      >
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
      </div>
    </>
  );
}

function ConfirmDialogWrapper(props: ConfirmProps & PortalInjectedProps) {
  return (
    <PortalModal {...props} size="sm" hideCloseButton>
      <ConfirmContent {...props} />
    </PortalModal>
  );
}

export const useConfirmModal = createPortalHook(ConfirmDialogWrapper);
