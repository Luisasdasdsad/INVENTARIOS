import nodemailer from 'nodemailer';
import { config } from  'dotenv';

config();

export const enviarCorreo = async ({ to, subject, html }) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"Sistema de Inventarios" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Correo enviado: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error enviando correo:", error);
        return null;
    }
};