import { X } from "lucide-react";

interface ChatHeaderProps {
    onlineUsers: number;
    onClose: () => void;
}

/**
 * Chat header with title, online count and close button
 */
export function ChatHeader({ onlineUsers, onClose }: ChatHeaderProps) {
    return (
        <div className="p-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <h3 className="font-semibold">Public Global Chat</h3>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    {onlineUsers} online
                </span>
            </div>
            <button
                onClick={onClose}
                className="hover:bg-white/20 p-1 rounded-full transition-colors"
                aria-label="Close chat"
            >
                <X size={20} />
            </button>
        </div>
    );
}
