import React, { useState, useRef, useEffect, useMemo } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, setYear, getYear, setMonth, getMonth, isToday, parse, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon } from "@heroicons/react/24/outline";
import {
    useFloating,
    autoUpdate,
    offset,
    flip,
    shift,
} from "@floating-ui/react";
import clsx from "clsx";
import { Portal } from "@/components/util/portal";
import DateTime from "@utils/data/DateTime";

interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value?: Date | DateTime;
    onChange?: (date: Date) => any;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    required?: boolean;
    showTime?: boolean;
}

export function DatePicker({
    value,
    onChange,
    placeholder = "Seleccionar fecha...",
    className,
    disabled = false,
    required = false,
    showTime = false,
    ...props
}: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'day' | 'year'>('day');
    const [viewDate, setViewDate] = useState(value instanceof DateTime ? value : (value || new Date()));
    const [inputValue, setInputValue] = useState("");
    const [showTooltip, setShowTooltip] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isEditingRef = useRef(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Convert value to Date for easier internal handling if it's DateTime
    const selectedDate = value instanceof DateTime ? value : value;

    const { refs, x, y, strategy } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        whileElementsMounted: autoUpdate,
        placement: "bottom-start",
        middleware: [
            offset(8),
            flip(),
            shift(),
        ],
    });

    const { refs: tooltipRefs, x: tx, y: ty, strategy: tStrategy } = useFloating({
        open: showTooltip,
        placement: "top",
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(10),
            flip(),
            shift(),
        ],
    });

    const formatString = showTime ? "dd/MM/yyyy hh:mm aaa" : "dd/MM/yyyy";

    // Sync input value with selected date when it changes (but NOT while typing)
    useEffect(() => {
        if (isEditingRef.current) return;

        if (selectedDate && isValid(selectedDate)) {
            const newFormatted = format(selectedDate, formatString, { locale: es });
            if (newFormatted !== inputValue) {
                setInputValue(newFormatted);
            }
        } else if (!selectedDate) {
            setInputValue("");
        }
    }, [selectedDate, formatString]);

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

    useEffect(() => {
        if (!isOpen) {
            setViewMode('day');
        }
    }, [isOpen]);

    const handleToggle = () => {
        if (!disabled) setIsOpen(!isOpen);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        isEditingRef.current = true;
        const val = e.target.value;
        setInputValue(val);
        setShowTooltip(false);

        // Try to parse the input
        const formats = showTime
            ? ["dd/MM/yyyy hh:mm aaa", "dd/MM/yyyy HH:mm", "dd/MM/yy HH:mm", "yyyy-MM-dd HH:mm", "dd/MM/yyyy hh:mm a"]
            : ["dd/MM/yyyy", "dd/MM/yy", "yyyy-MM-dd"];

        let parsedDate: Date | null = null;
        for (const f of formats) {
            const d = parse(val, f, new Date());
            if (isValid(d)) {
                parsedDate = d;
                break;
            }
        }

        if (parsedDate) {
            onChange?.(parsedDate);
            setViewDate(parsedDate);
        }
    };

    const handleBlur = () => {
        isEditingRef.current = false;

        // Re-sync input value to ensure it matches the canonical format on blur
        if (selectedDate && isValid(selectedDate)) {
            setInputValue(format(selectedDate, formatString, { locale: es }));
        }

        if (!inputValue) return;

        const formats = showTime
            ? ["dd/MM/yyyy hh:mm aaa", "dd/MM/yyyy HH:mm", "dd/MM/yy HH:mm", "yyyy-MM-dd HH:mm", "dd/MM/yyyy hh:mm a"]
            : ["dd/MM/yyyy", "dd/MM/yy", "yyyy-MM-dd"];

        let isValidDate = false;
        for (const f of formats) {
            if (isValid(parse(inputValue, f, new Date()))) {
                isValidDate = true;
                break;
            }
        }

        if (!isValidDate) {
            setShowTooltip(true);
            if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
            tooltipTimeoutRef.current = setTimeout(() => setShowTooltip(false), 3000);
        }
    };

    useEffect(() => {
        return () => {
            if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
        };
    }, []);

    const handleInputFocus = () => {
        if (!disabled) setIsOpen(true);
    };

    const handleDateSelect = (date: Date) => {
        if (showTime && selectedDate) {
            const newDate = new Date(date);
            newDate.setHours(selectedDate.getHours());
            newDate.setMinutes(selectedDate.getMinutes());
            onChange?.(newDate);
        } else {
            onChange?.(date);
            if (!showTime) setIsOpen(false);
        }
    };


    return (
        <div ref={containerRef} className={clsx("relative w-full", className)}>
            <div className="relative">
                <input
                    ref={(node) => {
                        (inputRef as any).current = node;
                        refs.setReference(node);
                        tooltipRefs.setReference(node);
                    }}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    onFocus={handleInputFocus}
                    onClick={() => {
                        if (!disabled) {
                            setIsOpen(true);
                            isEditingRef.current = true;
                        }
                    }}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={clsx(
                        "w-full pl-10 pr-4 py-2.5 text-sm transition-all duration-200 bg-white border rounded-xl shadow-sm hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100",
                        isOpen ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-gray-300",
                        required && !value && "border-red-300"
                    )}
                    {...props}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <CalendarIcon className={clsx("w-5 h-5", selectedDate ? "text-indigo-500" : "text-gray-400")} />
                </div>
                {showTime && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                    </div>
                )}
            </div>

            <Portal>
                <AnimatePresence>
                    {showTooltip && (
                        <motion.div
                            ref={tooltipRefs.setFloating}
                            style={{
                                position: tStrategy,
                                top: ty ?? 0,
                                left: tx ?? 0,
                            }}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="z-[2100] px-3 py-1.5 bg-red-600 text-white text-[11px] font-bold rounded-lg shadow-xl flex items-center gap-2"
                        >
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            Fecha inválida (usar dd/mm/yyyy)
                        </motion.div>
                    )}
                </AnimatePresence>
            </Portal>

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
                            className="z-[2000] overflow-hidden bg-white border border-gray-200 shadow-xl rounded-2xl dark:bg-gray-900 dark:border-gray-800 p-4 min-w-[320px]"
                        >
                            {viewMode === 'day' ? (
                                <CalendarView
                                    viewDate={viewDate}
                                    setViewDate={setViewDate}
                                    selectedDate={selectedDate || undefined}
                                    onDateSelect={handleDateSelect}
                                    onYearClick={() => setViewMode('year')}
                                />
                            ) : (
                                <YearPickerView
                                    viewDate={viewDate}
                                    onYearSelect={(year) => {
                                        setViewDate(setYear(viewDate, year));
                                        setViewMode('day');
                                    }}
                                />
                            )}

                        </motion.div>
                    )}
                </AnimatePresence>
            </Portal>
        </div>
    );
}

function CalendarView({ viewDate, setViewDate, selectedDate, onDateSelect, onYearClick }: {
    viewDate: Date;
    setViewDate: (date: Date) => void;
    selectedDate?: Date;
    onDateSelect: (date: Date) => void;
    onYearClick: () => void;
}) {
    const calendarDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [viewDate]);

    const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <button
                    onClick={() => setViewDate(subMonths(viewDate, 1))}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex space-x-1 font-semibold text-gray-900 dark:text-white">
                    <span
                        className="hover:text-indigo-600 cursor-pointer px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                        onClick={() => { }} // Could add month picker later
                    >
                        {format(viewDate, "MMMM", { locale: es })}
                    </span>
                    <span
                        className="hover:text-indigo-600 cursor-pointer px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                        onClick={onYearClick}
                    >
                        {format(viewDate, "yyyy")}
                    </span>
                </div>
                <button
                    onClick={() => setViewDate(addMonths(viewDate, 1))}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
                {weekDays.map(day => (
                    <div key={day} className="h-8 flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
                {calendarDays.map((day: Date, idx: number) => {
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, viewDate);
                    const today = isToday(day);

                    return (
                        <button
                            key={idx}
                            onClick={() => onDateSelect(day)}
                            className={clsx(
                                "relative h-10 w-10 flex items-center justify-center text-sm rounded-xl transition-all duration-200",
                                !isCurrentMonth && "text-gray-300 dark:text-gray-600",
                                isCurrentMonth && !isSelected && "hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-700 dark:text-gray-300",
                                isSelected && "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50 font-bold",
                                today && !isSelected && "text-indigo-600 font-bold"
                            )}
                        >
                            {format(day, "d")}
                            {today && !isSelected && (
                                <div className="absolute bottom-1.5 w-1 h-1 bg-indigo-600 rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function YearPickerView({ viewDate, onYearSelect }: { viewDate: Date, onYearSelect: (year: number) => void }) {
    const currentSelectedYear = getYear(viewDate);
    // Group by 12 years for a nice 3x4 grid
    const [pageStartYear, setPageStartYear] = useState(Math.floor(currentSelectedYear / 12) * 12);
    const years = Array.from({ length: 12 }, (_, i) => pageStartYear + i);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setPageStartYear(s => s - 12);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                </button>
                <div className="font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-4 py-1 rounded-full text-sm">
                    {pageStartYear} - {pageStartYear + 11}
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setPageStartYear(s => s + 12);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            <div className="grid grid-cols-3 gap-2 p-1">
                {years.map(year => (
                    <button
                        key={year}
                        onClick={() => onYearSelect(year)}
                        className={clsx(
                            "py-3 text-sm rounded-xl transition-all duration-200 font-bold",
                            year === currentSelectedYear
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50"
                                : "text-gray-700 hover:bg-indigo-50 dark:text-gray-300 dark:hover:bg-gray-800 hover:text-indigo-600"
                        )}
                    >
                        {year}
                    </button>
                ))}
            </div>
        </div>
    );
}

