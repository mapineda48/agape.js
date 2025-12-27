import { motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { clsx } from "clsx";

interface ChatToggleButtonProps {
    isOpen: boolean;
    unreadCount: number;
    onClick: () => void;
}

/**
 * Floating toggle button for opening/closing the chat
 */
export function ChatToggleButton({ isOpen, unreadCount, onClick }: ChatToggleButtonProps) {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            aria-label={isOpen ? "Close chat" : "Open chat"}
            aria-expanded={isOpen}
            className={clsx(
                "w-14 h-14 rounded-full shadow-lg flex items-center justify-center relative transition-colors duration-300",
                isOpen
                    ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                    : "bg-indigo-600 text-white"
            )}
        >
            {isOpen ? <X size={28} /> : <MessageCircle size={28} />}

            {/* Notification Badge */}
            {!isOpen && unreadCount > 0 && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900"
                >
                    {unreadCount > 9 ? "9+" : unreadCount}
                </motion.div>
            )}
        </motion.button>
    );
}
