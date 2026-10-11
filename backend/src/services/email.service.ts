import nodemailer from "nodemailer";

export async function sendPasswordResetEmail(
  recipientEmail: string,
  resetToken: string
): Promise<void> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  const frontendUrl = process.env.FRONTEND_URL;

  if (!gmailUser || !gmailAppPassword || !frontendUrl) {
    throw new Error("Email service is not configured");
  }

  const resetUrl = new URL("/reset-password", frontendUrl);
  resetUrl.searchParams.set("token", resetToken);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword.replace(/\s/g, ""),
    },
  });

  await transporter.sendMail({
    from: `"NH Digital Bank" <${gmailUser}>`,
    to: recipientEmail,
    subject: "Reset your NH Digital Bank password",
    text: [
      "We received a request to reset your NH Digital Bank password.",
      "",
      `Reset your password here: ${resetUrl.toString()}`,
      "",
      "This link expires in 15 minutes.",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
        <h2>NH Digital Bank</h2>
        <p>We received a request to reset your password.</p>
        <p>
          <a href="${resetUrl.toString()}"
             style="display:inline-block;padding:12px 20px;
                    background:#123b70;color:#fff;
                    text-decoration:none;border-radius:6px">
            Reset Password
          </a>
        </p>
        <p>This link expires in 15 minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}