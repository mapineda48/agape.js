/**
 * Sales Invoice Email Template
 * 
 * HTML template for sending sales invoices to customers via email.
 */

export interface SalesInvoiceEmailData {
    /** Invoice document number (e.g., "FAC-001") */
    documentNumber: string;
    /** Client name */
    clientName: string;
    /** Issue date formatted */
    issueDate: string;
    /** Due date formatted (optional) */
    dueDate?: string;
    /** Total amount formatted */
    totalAmount: string;
    /** Company name */
    companyName: string;
    /** Company email (optional) */
    companyEmail?: string;
    /** Company phone (optional) */
    companyPhone?: string;
}

/**
 * Generates the HTML content for a sales invoice email
 */
export function generateSalesInvoiceEmailHtml(data: SalesInvoiceEmailData): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Factura de Venta ${data.documentNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                                ${data.companyName}
                            </h1>
                            <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.8); font-size: 14px;">
                                Factura de Venta
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <!-- Greeting -->
                            <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                                Estimado/a <strong>${data.clientName}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                                Le hacemos llegar su factura de venta. Por favor, encuentre adjunto el documento PDF correspondiente.
                            </p>
                            
                            <!-- Invoice Details Card -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-radius: 12px; margin: 24px 0;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <h2 style="margin: 0 0 16px 0; color: #059669; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                                            Detalles de la Factura
                                        </h2>
                                        
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Número de Factura:</td>
                                                <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${data.documentNumber}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Fecha de Emisión:</td>
                                                <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${data.issueDate}</td>
                                            </tr>
                                            ${data.dueDate ? `
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Fecha de Vencimiento:</td>
                                                <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${data.dueDate}</td>
                                            </tr>
                                            ` : ''}
                                            <tr>
                                                <td colspan="2" style="border-top: 2px solid #a7f3d0; padding-top: 16px; margin-top: 16px;"></td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #111827; font-size: 16px; font-weight: 600;">Total a Pagar:</td>
                                                <td style="padding: 8px 0; color: #059669; font-size: 20px; font-weight: 700; text-align: right;">${data.totalAmount}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA -->
                            <p style="margin: 24px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                📎 El PDF de su factura se encuentra adjunto a este correo.
                            </p>
                            
                            <!-- Divider -->
                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
                            
                            <!-- Questions -->
                            <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                Si tiene alguna pregunta sobre esta factura, no dude en contactarnos:
                            </p>
                            ${data.companyEmail ? `
                            <p style="margin: 8px 0 0 0; color: #374151; font-size: 14px;">
                                📧 <a href="mailto:${data.companyEmail}" style="color: #059669; text-decoration: none;">${data.companyEmail}</a>
                            </p>
                            ` : ''}
                            ${data.companyPhone ? `
                            <p style="margin: 8px 0 0 0; color: #374151; font-size: 14px;">
                                📞 ${data.companyPhone}
                            </p>
                            ` : ''}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 8px 0; color: #059669; font-size: 14px; font-weight: 600;">
                                ¡Gracias por su preferencia!
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                Este correo fue enviado automáticamente por ${data.companyName}
                            </p>
                        </td>
                    </tr>
                </table>
                
                <!-- Sub Footer -->
                <table width="600" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 24px; text-align: center;">
                            <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                                © ${new Date().getFullYear()} ${data.companyName}. Todos los derechos reservados.
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

/**
 * Generates the email subject for a sales invoice
 */
export function generateSalesInvoiceEmailSubject(documentNumber: string, companyName: string): string {
    return `Factura de Venta ${documentNumber} - ${companyName}`;
}
