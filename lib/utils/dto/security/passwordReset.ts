export interface RequestPasswordResetInput {
    userId: number;
    resetUrl: string;
    email?: string;
}

export interface RequestPasswordResetByEmailInput {
    email: string;
    resetUrl: string;
}

export interface RequestPasswordResetResult {
    success: boolean;
    message: string;
    recipientEmail?: string;
    expiresAt?: string;
}

export interface ResetPasswordInput {
    token: string;
    newPassword: string;
}

export interface ResetPasswordResult {
    success: boolean;
    message: string;
}

export interface ValidatePasswordResetTokenResult {
    success: boolean;
    message: string;
    userId?: number;
    expiresAt?: string;
}
