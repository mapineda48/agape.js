import { useState, useEffect, useRef, useCallback } from "react";
import socket from "@agape/public/socket";
import type { ChatMessage, TypingPayload, UsersCountPayload } from "../types";

/**
 * Custom hook that manages the chat socket connection and state.
 * Handles message sending/receiving, typing indicators, and online user count.
 */
export function useChatSocket() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const [onlineUsers, setOnlineUsers] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    // Generate a unique user ID per session
    const [myId] = useState(() => Math.random().toString(36).substring(7));

    const connectionRef = useRef<ReturnType<typeof socket.connect> | null>(null);
    const isOpenRef = useRef(isOpen);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastEmitRef = useRef<number>(0);

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
        connectionRef.current = conn;

        const unsubMessage = conn.on("message:received", (msg: ChatMessage) => {
            setMessages((prev) => [...prev, msg]);
            if (!isOpenRef.current) {
                setUnreadCount((prev) => prev + 1);
            }
        });

        const unsubTyping = conn.on("user:typing", (payload: TypingPayload) => {
            if (payload.sender === `User ${myId}`) return;

            setTypingUser(payload.sender);

            // Clear status after 3 seconds of no typing updates
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
        });

        const unsubTypingStop = conn.on("user:typing:stop", (payload: TypingPayload) => {
            if (payload.sender === `User ${myId}`) return;
            setTypingUser(null);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        });

        const unsubUsersCount = conn.on("users:count", (payload: UsersCountPayload) => {
            setOnlineUsers(payload.count);
        });

        return () => {
            unsubMessage();
            unsubTyping();
            unsubTypingStop();
            unsubUsersCount();
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            conn.disconnect();
        };
    }, [myId]);

    // Send a message
    const sendMessage = useCallback((text: string) => {
        const conn = connectionRef.current;
        if (!text.trim() || !conn) return;

        conn.emit("message:send", {
            text: text.trim(),
            sender: `User ${myId}`,
        });

        // Immediately notify we stopped typing
        conn.emit("user:typing:stop", { sender: `User ${myId}` });
        lastEmitRef.current = 0;
    }, [myId]);

    // Emit typing indicator (throttled)
    const emitTyping = useCallback((text: string) => {
        const conn = connectionRef.current;
        if (!conn) return;

        if (!text) {
            // If text is cleared (sent), immediately notify we stopped typing
            if (lastEmitRef.current > 0) {
                conn.emit("user:typing:stop", { sender: `User ${myId}` });
                lastEmitRef.current = 0;
            }
            return;
        }

        // Throttling to avoid flooding: only emit every 1.5 seconds
        const now = Date.now();
        if (now - lastEmitRef.current > 1500) {
            conn.emit("user:typing", { sender: `User ${myId}` });
            lastEmitRef.current = now;
        }
    }, [myId]);

    const openChat = useCallback(() => setIsOpen(true), []);
    const closeChat = useCallback(() => setIsOpen(false), []);
    const toggleChat = useCallback(() => setIsOpen((prev) => !prev), []);

    return {
        // State
        messages,
        unreadCount,
        typingUser,
        onlineUsers,
        isOpen,
        myId,
        // Actions
        sendMessage,
        emitTyping,
        openChat,
        closeChat,
        toggleChat,
    };
}
