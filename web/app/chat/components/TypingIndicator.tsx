import { motion, AnimatePresence } from "framer-motion";

interface TypingIndicatorProps {
    typingUser: string | null;
}

/**
 * Animated typing indicator showing when someone is typing
 */
export function TypingIndicator({ typingUser }: TypingIndicatorProps) {
    return (
        <AnimatePresence>
            {typingUser && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="px-4 py-1 flex items-center gap-2 text-[11px] text-zinc-500 italic"
                >
                    <div className="flex gap-1">
                        <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                    {typingUser} is typing...
                </motion.div>
            )}
        </AnimatePresence>
    );
}
