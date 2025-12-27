import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatSocket } from "./hooks";
import {
    ChatHeader,
    ChatMessages,
    ChatInput,
    TypingIndicator,
    ChatToggleButton,
} from "./components";

/**
 * Animation variants for the chat window
 */
const chatWindowVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
} as const;

/**
 * Public Global Chat Component
 *
 * Functions as a floating button in the bottom-right corner.
 * Connects to the public global chat namespace.
 * Should be rendered once at the root layout level.
 */
export default function Chat() {
    const {
        messages,
        unreadCount,
        typingUser,
        onlineUsers,
        isOpen,
        myId,
        sendMessage,
        emitTyping,
        toggleChat,
        closeChat,
    } = useChatSocket();

    const [text, setText] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Handle text input and emit typing indicator
    const handleTextChange = useCallback(
        (value: string) => {
            setText(value);
            emitTyping(value);
        },
        [emitTyping]
    );

    // Handle sending message
    const handleSend = useCallback(() => {
        if (!text.trim()) return;
        sendMessage(text);
        setText("");
    }, [text, sendMessage]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen, typingUser]);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        variants={chatWindowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Global chat"
                        className="mb-4 w-80 sm:w-96 h-[500px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        <ChatHeader onlineUsers={onlineUsers} onClose={closeChat} />

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
                        >
                            <ChatMessages
                                messages={messages}
                                myId={myId}
                                scrollRef={scrollRef}
                            />
                        </div>

                        <TypingIndicator typingUser={typingUser} />

                        <ChatInput
                            value={text}
                            onChange={handleTextChange}
                            onSubmit={handleSend}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <ChatToggleButton
                isOpen={isOpen}
                unreadCount={unreadCount}
                onClick={toggleChat}
            />
        </div>
    );
}
