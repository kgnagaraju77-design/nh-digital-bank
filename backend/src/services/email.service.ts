import { Resend } from "resend";

export async function sendPasswordResetEmail(
  recipientEmail: string,
  resetToken: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const frontendUrl = process.env.FRONTEND_URL;

  const from =
    process.env.RESEND_FROM ||
    "NH Digital Bank <onboarding@resend.dev>";

  if (!apiKey || !frontendUrl) {
    throw new Error(
      "Resend email service is not configured"
    );
  }

  const resetUrl = new URL(
    "/reset-password",
    frontendUrl
  );

  resetUrl.searchParams.set("token", resetToken);

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from,
    to: [recipientEmail],
    subject: "Reset your NH Digital Bank password",
    text: [
      "We received a request to reset your password.",
      "",
      `Reset your password here: ${resetUrl.toString()}`,
      "",
      "This link expires in 15 minutes.",
      "If you did not request this, ignore this email.",
    ].join("\n"),
    html: `
      <h2>NH Digital Bank</h2>
      <p>We received a request to reset your password.</p>
      <p>
        <a href="${resetUrl.toString()}">
          Reset your password
        </a>
      </p>
      <p>This link expires in 15 minutes.</p>
      <p>If you did not request this, ignore this email.</p>
    `,
  });

  if (error) {
    throw new Error(
      `Resend failed: ${error.message}`
    );
  }

  if (!data?.id) {
    throw new Error(
      "Resend did not return an email ID"
    );
  }
}