import type {
    ResetPasswordInput,
    ResetPasswordResult,
    ValidatePasswordResetTokenResult,
} from "#utils/dto/security/passwordReset";
import {
    resetPasswordWithToken as resetPasswordWithTokenInternal,
    validatePasswordResetToken as validatePasswordResetTokenInternal,
} from "#svc/security/user";

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
