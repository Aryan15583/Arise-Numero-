// Sends one test email to ADMIN_LOGIN_EMAIL using the same code path as the
// admin login code, so you can confirm SMTP/Resend works BEFORE relying on it.
//   npm run test-email

try {
  process.loadEnvFile(".env");
} catch {
  /* no .env file — rely on the real environment */
}

async function main() {
  // Dynamic imports so .env is loaded before these modules read process.env.
  const { emailProvider, sendEmail } = await import("../lib/email");
  const { getAdminLoginEmail } = await import("../lib/admin-otp");

  const to = getAdminLoginEmail();
  const provider = emailProvider();
  console.log(`Provider : ${provider ?? "none"}`);
  console.log(`Sending  : test message to ${to}`);
  console.log("");

  if (!provider) {
    console.log("No email provider configured. Set SMTP_HOST / SMTP_USER / SMTP_PASS (Gmail + an App Password) in .env — see .env.example.");
    process.exitCode = 1;
    return;
  }

  const result = await sendEmail({
    to,
    subject: "Arise Numero — test email",
    html: "<p>If you can read this, admin login codes and order emails will reach this inbox. ✦</p>",
  });

  console.log("");
  if (result === "sent") {
    console.log(`Sent. Check the inbox (and spam folder) of ${to}.`);
  } else {
    console.log("FAILED — see the error logged above. For Gmail: use an App Password and make sure 2-Step Verification is on.");
    process.exitCode = 1;
  }
}

main().then(() => process.exit());
