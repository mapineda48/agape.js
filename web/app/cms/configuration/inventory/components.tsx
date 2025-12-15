import type { ReactNode } from "react";
import clsx from "clsx";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export function Card({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-200">
            {icon}
          </span>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">{action}</div>
      </div>
      {children}
    </div>
  );
}

export function StackedList<T>({
  items,
  loading,
  empty,
  render,
  pagination,
}: {
  items: T[];
  loading: boolean;
  empty: string;
  render: (item: T) => {
    title: string;
    subtitle?: string;
    badge?: string;
    badgeTone?: "green" | "amber" | "blue" | "gray";
    extraChip?: string;
    extraTone?: "green" | "amber" | "blue" | "gray";
    onEdit: () => void;
    onDelete: () => void;
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    startIndex: number;
    endIndex: number;
  };
}) {
  const badgeMap: Record<string, string> = {
    green:
      "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
    amber:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
    gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        Cargando...
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        {empty}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-red">
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {items.map((item, idx) => {
          const row = render(item);
          return (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {row.title}
                </p>
                {row.subtitle ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {row.subtitle}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2 mt-1">
                  {row.badge ? (
                    <span
                      className={clsx(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                        badgeMap[row.badgeTone || "gray"]
                      )}
                    >
                      {row.badge}
                    </span>
                  ) : null}
                  {row.extraChip ? (
                    <span
                      className={clsx(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                        badgeMap[row.extraTone || "gray"]
                      )}
                    >
                      {row.extraChip}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={row.onEdit}
                  className="rounded-md p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-900/40 transition-colors"
                  title="Editar"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={row.onDelete}
                  className="rounded-md p-2 text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/40 transition-colors"
                  title="Eliminar"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6 mt-auto">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-400">
                Mostrando{" "}
                <span className="font-medium">{pagination.startIndex + 1}</span>{" "}
                a{" "}
                <span className="font-medium">
                  {Math.min(pagination.endIndex, pagination.totalItems)}
                </span>{" "}
                de <span className="font-medium">{pagination.totalItems}</span>{" "}
                resultados
              </p>
            </div>
            <div>
              <nav
                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                aria-label="Pagination"
              >
                <button
                  onClick={() =>
                    pagination.onPageChange(
                      Math.max(1, pagination.currentPage - 1)
                    )
                  }
                  disabled={pagination.currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus:z-20 focus:outline-offset-0"
                >
                  <span className="sr-only">Anterior</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === pagination.totalPages ||
                      Math.abs(page - pagination.currentPage) <= 1
                  )
                  .map((page, index, array) => {
                    const showEllipsis =
                      index > 0 && page - array[index - 1] > 1;

                    return (
                      <div key={page} className="flex">
                        {showEllipsis && (
                          <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:outline-offset-0">
                            ...
                          </span>
                        )}
                        <button
                          onClick={() => pagination.onPageChange(page)}
                          aria-current={
                            pagination.currentPage === page ? "page" : undefined
                          }
                          className={clsx(
                            pagination.currentPage === page
                              ? "relative z-10 inline-flex items-center bg-indigo-600 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                              : "relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 focus:z-20 focus:outline-offset-0"
                          )}
                        >
                          {page}
                        </button>
                      </div>
                    );
                  })}
                <button
                  onClick={() =>
                    pagination.onPageChange(
                      Math.min(
                        pagination.totalPages,
                        pagination.currentPage + 1
                      )
                    )
                  }
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus:z-20 focus:outline-offset-0"
                >
                  <span className="sr-only">Siguiente</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
          {/* Mobile view */}
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() =>
                pagination.onPageChange(Math.max(1, pagination.currentPage - 1))
              }
              disabled={pagination.currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() =>
                pagination.onPageChange(
                  Math.min(pagination.totalPages, pagination.currentPage + 1)
                )
              }
              disabled={pagination.currentPage === pagination.totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Field({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-1.5 block">
      <span className="text-sm font-medium text-gray-900 dark:text-white">
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
