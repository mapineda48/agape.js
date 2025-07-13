// sendEmail.ts
import sgMail from "@sendgrid/mail";

// 1. Coloca tu API Key aquí (o usa variables de entorno)
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "TU_API_KEY_AQUI");

// 2. Crea el mensaje
const msg = {
  to: "destinatario@example.com", // Correo de prueba
  from: "noreply@mapineda48.de",  // Tu remitente autenticado
//  replyTo: "soporte@mapineda48.de", // Opcional
  subject: "Bienvenido a AgapeApp 🎉",
  text: "Este es un correo de prueba enviado con SendGrid y Node.js.",
  html: "<strong>Este es un correo de prueba enviado con SendGrid y Node.js.</strong>",
};

// 3. Enviar el correo
sgMail
  .send(msg)
  .then(() => {
    console.log("✅ Correo enviado correctamente");
  })
  .catch((error) => {
    console.error("❌ Error al enviar el correo:", error.response?.body || error);
  });