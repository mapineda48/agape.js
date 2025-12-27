/**
 * Message structure for the global chat
 */
export interface ChatMessage {
    id: string;
    text: string;
    sender: string;
    timestamp: number;
}

/**
 * Typing event payload
 */
export interface TypingPayload {
    sender: string;
}

/**
 * Users count event payload
 */
export interface UsersCountPayload {
    count: number;
}
