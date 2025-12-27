import { memo } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
}

/**
 * Chat input form with text field and send button
 */
export const ChatInput = memo(function ChatInput({
    value,
    onChange,
    onSubmit,
}: ChatInputProps) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800/50 flex gap-2"
        >
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Write a message..."
                className="flex-1 bg-white dark:bg-zinc-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
            />
            <button
                type="submit"
                disabled={!value.trim()}
                className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
            >
                <Send size={20} />
            </button>
        </form>
    );
});
