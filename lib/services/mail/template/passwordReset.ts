export interface PasswordResetEmailData {
    employeeName: string;
    resetUrl: string;
    companyName: string;
    supportEmail?: string;
}

export interface PasswordChangedEmailData {
    employeeName: string;
    companyName: string;
    supportEmail?: string;
}

export function generatePasswordResetEmailSubject(companyName: string): string {
    return `Restablecer contrasena - ${companyName}`;
}

export function generatePasswordChangedEmailSubject(companyName: string): string {
    return `Contrasena actualizada - ${companyName}`;
}

export function generatePasswordResetEmailHtml(data: PasswordResetEmailData): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Restablecer contrasena</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 16px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 32px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                                ${data.companyName}
                            </h1>
                            <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.85); font-size: 14px;">
                                Cambio de contrasena
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 32px;">
                            <p style="margin: 0 0 16px 0; color: #0f172a; font-size: 16px; line-height: 1.6;">
                                Hola <strong>${data.employeeName}</strong>,
                            </p>
                            <p style="margin: 0 0 24px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                                Recibimos una solicitud para restablecer tu contrasena. El enlace es valido por 15 minutos.
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${data.resetUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600;">
                                            Cambiar contrasena
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 0 0 20px 0; color: #64748b; font-size: 13px; line-height: 1.6;">
                                Si no solicitaste este cambio, puedes ignorar este correo.
                            </p>
                            ${data.supportEmail ? `
                            <p style="margin: 0; color: #64748b; font-size: 13px;">
                                Soporte: <a href="mailto:${data.supportEmail}" style="color: #2563eb; text-decoration: none;">${data.supportEmail}</a>
                            </p>
                            ` : ""}
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f1f5f9; padding: 20px; text-align: center;">
                            <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                                Este mensaje fue enviado automaticamente por ${data.companyName}.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

export function generatePasswordChangedEmailHtml(data: PasswordChangedEmailData): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrasena actualizada</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 16px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #16a34a 0%, #059669 100%); padding: 32px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                                ${data.companyName}
                            </h1>
                            <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.85); font-size: 14px;">
                                Contrasena actualizada
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 32px;">
                            <p style="margin: 0 0 16px 0; color: #0f172a; font-size: 16px; line-height: 1.6;">
                                Hola <strong>${data.employeeName}</strong>,
                            </p>
                            <p style="margin: 0 0 20px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                                Tu contrasena se actualizo correctamente. Si no realizaste este cambio, contacta al equipo de soporte de inmediato.
                            </p>
                            ${data.supportEmail ? `
                            <p style="margin: 0; color: #64748b; font-size: 13px;">
                                Soporte: <a href="mailto:${data.supportEmail}" style="color: #2563eb; text-decoration: none;">${data.supportEmail}</a>
                            </p>
                            ` : ""}
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f1f5f9; padding: 20px; text-align: center;">
                            <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                                Este mensaje fue enviado automaticamente por ${data.companyName}.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}
