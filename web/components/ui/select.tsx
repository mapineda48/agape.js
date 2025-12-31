import React, { useState, useRef, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";
import {
    useFloating,
    autoUpdate,
    offset,
    flip,
    shift,
    size,
} from "@floating-ui/react";
import clsx from "clsx";
import { Portal } from "@/components/util/portal";

interface SelectProps<T> {
    value?: T;
    onChange?: (value: T) => void;
    placeholder?: string;
    children: ReactNode;
    className?: string;
    disabled?: boolean;
    required?: boolean;
}

export function Select<T>({
    value,
    onChange,
    placeholder = "Seleccionar...",
    children,
    className,
    disabled = false,
    required = false,
}: SelectProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const { refs, x, y, strategy } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        whileElementsMounted: autoUpdate,
        placement: "bottom-start",
        middleware: [
            offset(8),
            flip(),
            shift(),
            size({
                apply({ rects, elements }) {
                    Object.assign(elements.floating.style, {
                        width: `${rects.reference.width}px`,
                    });
                },
            }),
        ],
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node) &&
                refs.floating.current &&
                !refs.floating.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [refs.floating]);

    const handleToggle = () => {
        if (!disabled) setIsOpen(!isOpen);
    };

    const selectedChild = React.Children.toArray(children).find(
        (child: any) => child?.props?.value === value
    ) as any;

    return (
        <div ref={containerRef} className={clsx("relative w-full", className)}>
            <button
                ref={refs.setReference}
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className={clsx(
                    "flex items-center justify-between w-full px-4 py-2.5 text-sm transition-all duration-200 bg-white border rounded-xl shadow-sm hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400",
                    isOpen ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-gray-300",
                    required && !value && "border-red-300"
                )}
            >
                <span className={clsx("block truncate", !value && "text-gray-400")}>
                    {selectedChild && selectedChild.props.value !== undefined ? selectedChild.props.children : placeholder}
                </span>
                <ChevronDownIcon
                    className={clsx(
                        "w-4 h-4 ml-2 transition-transform duration-200 text-gray-400",
                        isOpen && "transform rotate-180 text-indigo-500"
                    )}
                />
            </button>

            <Portal>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            ref={refs.setFloating}
                            style={{
                                position: strategy,
                                top: y ?? 0,
                                left: x ?? 0,
                            }}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="z-[2000] overflow-hidden bg-white border border-gray-200 shadow-xl rounded-2xl dark:bg-gray-900 dark:border-gray-800"
                        >
                            <div className="py-1 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                                {React.Children.map(children, (child: any) => {
                                    if (!child) return null;
                                    return React.cloneElement(child, {
                                        active: child.props.value === value,
                                        onClick: () => {
                                            onChange?.(child.props.value);
                                            setIsOpen(false);
                                        },
                                    });
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Portal>
        </div>
    );
}

interface SelectItemProps<T> {
    value: T;
    children: ReactNode;
    active?: boolean;
    onClick?: () => void;
    className?: string;
    icon?: ReactNode;
}

export function SelectItem<T>({
    value,
    children,
    active,
    onClick,
    className,
    icon,
}: SelectItemProps<T>) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={clsx(
                "group relative flex items-center w-full px-4 py-3 text-sm transition-all duration-200",
                active
                    ? "bg-indigo-50/80 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-semibold"
                    : "text-gray-700 hover:bg-indigo-50/40 dark:text-gray-300 dark:hover:bg-gray-800/40 hover:text-indigo-600",
                className
            )}
        >
            {/* Left accent border on hover or active */}
            <div className={clsx(
                "absolute left-0 top-0 bottom-0 w-1 transition-all duration-200",
                active ? "bg-indigo-600 h-full" : "bg-transparent h-0 group-hover:h-full group-hover:bg-indigo-400/50"
            )} />

            {icon && (
                <span className={clsx(
                    "mr-3 transition-colors duration-200",
                    active ? "text-indigo-600" : "text-gray-400 group-hover:text-indigo-400"
                )}>
                    {icon}
                </span>
            )}

            <span className="flex-1 text-left truncate">{children}</span>

            {active && (
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="ml-2"
                >
                    <CheckIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </motion.div>
            )}
        </button>
    );
}

