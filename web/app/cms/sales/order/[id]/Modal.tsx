import type { ReactNode } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface Props {
    title: string;
    children: ReactNode;
    onClose: () => void;
}

export function Modal({ title, children, onClose }: Props) {
    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="px-8 py-8">
                    {children}
                </div>
            </div>
        </div>
    );
}
