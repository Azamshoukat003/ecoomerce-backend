import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, text }) => {
    const transporter = await nodemailer.createTransport({
        service: "gmail", // or SMTP config
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    await transporter.sendMail({
        from: `"MyApp Support" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f4f4f4;">
            <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333;">🔐 Verify your account</h2>
            <p>Hi ${text},</p>
            <p>Use the OTP below to verify your account. This OTP is valid for <b>5 minutes</b>.</p>
            <p>If you did not request this, you can safely ignore this email.</p>
            <br/>
            <p style="font-size: 12px; color: #777;">— The MyApp Team</p>
            </div>
        </div>
  `,
    });
};
