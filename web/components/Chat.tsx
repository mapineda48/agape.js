import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, User, Bell } from "lucide-react";
import socket from "@agape/public/socket";
import { clsx } from "clsx";

/** Message structure */
export interface ChatMessage {
    id: string;
    text: string;
    sender: string;
    timestamp: number;
}

/**
 * Public Global Chat Component
 * 
 * Functions as a floating button in the bottom-right corner.
 * Connects to the public global chat namespace.
 */
export default function Chat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [text, setText] = useState("");
    const [myId] = useState(() => Math.random().toString(36).substring(7));
    const [connection, setConnection] = useState<any>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isOpenRef = useRef(isOpen);

    // Sync ref with state
    useEffect(() => {
        isOpenRef.current = isOpen;
        if (isOpen) {
            setUnreadCount(0);
        }
    }, [isOpen]);

    // Initialize socket connection
    useEffect(() => {
        const conn = socket.connect();
        setConnection(conn);

        const unsub = conn.on("message:received", (msg: ChatMessage) => {
            setMessages((prev) => [...prev, msg]);
            if (!isOpenRef.current) {
                setUnreadCount((prev) => prev + 1);
            }
        });

        return () => {
            unsub();
            conn.disconnect();
        };
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!text.trim() || !connection) return;

        connection.emit("message:send", {
            text: text.trim(),
            sender: `User ${myId}`,
        });
        setText("");
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="mb-4 w-80 sm:w-96 h-[500px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                <h3 className="font-semibold">Public Global Chat</h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="hover:bg-white/20 p-1 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
                        >
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-sm italic">
                                    <MessageCircle size={48} className="mb-2 opacity-20" />
                                    No messages yet. Be the first!
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.sender === `User ${myId}`;
                                    return (
                                        <div
                                            key={msg.id}
                                            className={clsx(
                                                "flex flex-col max-w-[85%]",
                                                isMe ? "ml-auto items-end" : "items-start"
                                            )}
                                        >
                                            <span className="text-[10px] text-zinc-500 mb-1 px-1">{msg.sender}</span>
                                            <div className={clsx(
                                                "px-4 py-2 rounded-2xl text-sm shadow-sm",
                                                isMe
                                                    ? "bg-indigo-600 text-white rounded-tr-none"
                                                    : "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-100 dark:border-zinc-700/50 rounded-tl-none"
                                            )}>
                                                {msg.text}
                                            </div>
                                            <span className="text-[10px] text-zinc-400 mt-1 px-1">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Input Area */}
                        <form
                            onSubmit={handleSend}
                            className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800/50 flex gap-2"
                        >
                            <input
                                type="text"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Write a message..."
                                className="flex-1 bg-white dark:bg-zinc-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                            />
                            <button
                                type="submit"
                                disabled={!text.trim()}
                                className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
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
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.div>
                )}
            </motion.button>
        </div>
    );
}
