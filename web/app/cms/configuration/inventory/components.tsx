import type { ReactNode } from "react";
import clsx from "clsx";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

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
      <div className="flex items-start justify-between gap-2">
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
        {action}
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
