import React, { useState, useRef, useEffect, ReactNode, useMemo } from "react";
import {
    useFloating,
    autoUpdate,
    offset,
    flip,
    shift,
} from "@floating-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { Portal } from "../util/portal";

interface SelectProps<T> {
    value?: T;
    onChange?: (value: T) => void;
    placeholder?: string;
    children: ReactNode;
    className?: string;
    disabled?: boolean;
    required?: boolean;
    "data-testid"?: string;
    id?: string;
    name?: string;
    "aria-label"?: string;
    "aria-labelledby"?: string;
}

export function Select<T>({
    value,
    onChange,
    placeholder = "Seleccionar...",
    children,
    className,
    disabled = false,
    required = false,
    "data-testid": testId,
    id,
    name,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
}: SelectProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const { refs, x, y, strategy } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        middleware: [offset(4), flip(), shift({ padding: 8 })],
        whileElementsMounted: autoUpdate,
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleToggle = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
        }
    };

    const childrenArray = useMemo(() => React.Children.toArray(children), [children]);

    // Helper to compare values accounting for type differences (e.g., number 0 vs string "0")
    const valuesMatch = (childValue: unknown, currentValue: T | undefined): boolean => {
        if (childValue === currentValue) return true;
        // For numeric/boolean comparisons with string option values
        if (currentValue !== undefined && currentValue !== null) {
            return String(childValue) === String(currentValue);
        }
        return false;
    };

    const selectedChild = childrenArray.find(
        (child) => React.isValidElement(child) && valuesMatch(child.props.value, value)
    ) as React.ReactElement | undefined;

    // Pre-calculate options for the hidden native select
    const options = useMemo(() => {
        const hasEmptyOption = childrenArray.some((child: any) =>
            child && (child.props.value === undefined || child.props.value === "" || child.props.value === null || child.props.value === 0)
        );

        return (
            <>
                {!hasEmptyOption && <option value="">{placeholder}</option>}
                {React.Children.map(children, (child: any) => {
                    if (!child) return null;
                    if (child.type === 'option') return child;
                    // value={undefined} in React doesn't render the value attribute, so we force it to "" for the null case
                    const val = child.props.value === undefined ? "" : child.props.value;
                    return <option value={val}>{child.props.children}</option>;
                })}
            </>
        );
    }, [children, childrenArray, placeholder]);

    return (
        <div ref={containerRef} className={clsx("relative w-full", className)}>
            <button
                ref={refs.setReference}
                type="button"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                onClick={handleToggle}
                disabled={disabled}
                data-testid={testId}
                className={clsx(
                    "flex items-center justify-between w-full px-4 py-2.5 text-sm transition-all duration-200 bg-white border rounded-xl shadow-sm hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400",
                    isOpen ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-gray-300",
                    required && !value && "border-red-300"
                )}
            >
                <span className={clsx("block truncate", (value === undefined || value === null || value === "") && "text-gray-400")}>
                    {selectedChild ? selectedChild.props.children : placeholder}
                </span>
                <ChevronDownIcon
                    className={clsx(
                        "w-4 h-4 ml-2 transition-transform duration-200 text-gray-400",
                        isOpen && "transform rotate-180 text-indigo-500"
                    )}
                />
            </button>

            {/* Hidden select for test compatibility and form submission */}
            <select
                tabIndex={-1}
                role="combobox"
                id={id}
                name={name}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledBy}
                data-testid={testId ? `${testId}-hidden` : undefined}
                required={required}
                disabled={disabled}
                value={value !== undefined && value !== null ? String(value) : ""}
                onChange={(e) => {
                    const stringVal = e.target.value;
                    if (onChange) {
                        // Find the original child to preserve the value's type
                        const foundChild = childrenArray.find((child: any) =>
                            child && String(child.props.value === undefined ? "" : child.props.value) === stringVal
                        ) as any;

                        if (foundChild) {
                            onChange(foundChild.props.value);
                        } else if (stringVal === "") {
                            onChange(undefined as any);
                        } else {
                            onChange(stringVal as any);
                        }
                    }
                }}
                style={{
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    padding: '0',
                    margin: '-1px',
                    overflow: 'hidden',
                    clip: 'rect(0, 0, 0, 0)',
                    whiteSpace: 'nowrap',
                    border: '0',
                    top: '50%',
                    left: '0',
                    pointerEvents: 'none'
                }}
            >
                {options}
            </select>

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
                                {childrenArray.map((child: any) => {
                                    if (!child) return null;

                                    // If child is a native option or another component, we try to extract its value and label
                                    if (child.type === 'option') {
                                        return (
                                            <SelectItem
                                                key={child.props.value}
                                                value={child.props.value}
                                                active={valuesMatch(child.props.value, value)}
                                                onClick={() => {
                                                    onChange?.(child.props.value);
                                                    setIsOpen(false);
                                                }}
                                            >
                                                {child.props.children}
                                            </SelectItem>
                                        );
                                    }

                                    return React.cloneElement(child, {
                                        active: valuesMatch(child.props.value, value),
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

interface SelectItemProps {
    value: any;
    children: ReactNode;
    active?: boolean;
    onClick?: () => void;
    className?: string;
    "data-testid"?: string;
}

export function SelectItem({
    children,
    active,
    onClick,
    className,
    "data-testid": testId,
}: SelectItemProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            data-testid={testId}
            className={clsx(
                "flex items-center w-full px-4 py-2.5 text-sm transition-colors duration-150",
                active
                    ? "bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-900/30 dark:text-indigo-300"
                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50",
                className
            )}
        >
            <span className="flex-1 truncate text-left">{children}</span>
            {active && (
                <svg
                    className="w-4 h-4 ml-2 text-indigo-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M5 13l4 4L19 7"
                    />
                </svg>
            )}
        </button>
    );
}
