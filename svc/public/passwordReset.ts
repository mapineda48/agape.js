import type {
    ResetPasswordInput,
    ResetPasswordResult,
    ValidatePasswordResetTokenResult,
    RequestPasswordResetByEmailInput,
    RequestPasswordResetResult,
} from "#utils/dto/security/passwordReset";
import {
    resetPasswordWithToken as resetPasswordWithTokenInternal,
    validatePasswordResetToken as validatePasswordResetTokenInternal,
    requestPasswordResetByEmail as requestPasswordResetByEmailInternal,
} from "#svc/security/user";

/**
 * @permission public.security.password.request
 */
export async function requestPasswordReset(
    input: RequestPasswordResetByEmailInput
): Promise<RequestPasswordResetResult> {
    return requestPasswordResetByEmailInternal(input);
}

/**
 * @permission public.security.password.validate
 */
export async function validatePasswordResetToken(
    token: string
): Promise<ValidatePasswordResetTokenResult> {
    return validatePasswordResetTokenInternal(token);
}

/**
 * @permission public.security.password.reset
 */
export async function resetPasswordWithToken(
    input: ResetPasswordInput
): Promise<ResetPasswordResult> {
    return resetPasswordWithTokenInternal(input);
}
