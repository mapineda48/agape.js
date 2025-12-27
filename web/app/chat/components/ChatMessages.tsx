import { useRef, useCallback, type RefObject } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Send } from "lucide-react";
import { clsx } from "clsx";
import type { ChatMessage } from "../types";

interface ChatMessagesProps {
    messages: ChatMessage[];
    myId: string;
    scrollRef: RefObject<HTMLDivElement>;
}

/**
 * Chat messages area component
 */
export function ChatMessages({ messages, myId, scrollRef }: ChatMessagesProps) {
    if (messages.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-sm italic">
                <MessageCircle size={48} className="mb-2 opacity-20" />
                No messages yet. Be the first!
            </div>
        );
    }

    return (
        <>
            {messages.map((msg) => {
                const isMe = msg.sender === `User ${myId}`;
                return (
                    <div
                        key={msg.id}
                        className={clsx(
                            "flex flex-col max-w-[85%]",
                            isMe ? "ml-auto items-end" : "items-start"
                        )}
                    >
                        <span className="text-[10px] text-zinc-500 mb-1 px-1">
                            {msg.sender}
                        </span>
                        <div
                            className={clsx(
                                "px-4 py-2 rounded-2xl text-sm shadow-sm",
                                isMe
                                    ? "bg-indigo-600 text-white rounded-tr-none"
                                    : "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-100 dark:border-zinc-700/50 rounded-tl-none"
                            )}
                        >
                            {msg.text}
                        </div>
                        <span className="text-[10px] text-zinc-400 mt-1 px-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                    </div>
                );
            })}
        </>
    );
}
