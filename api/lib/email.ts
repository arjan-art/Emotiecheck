/**
 * Email notifications via Resend (free tier: 3,000 emails/month)
 * Sign up at resend.com, get API key, configure in /settings
 */

export async function sendEmailNotification(
  toEmail: string,
  participantName: string,
  timestamp: Date,
  resendApiKey: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const timeStr = timestamp.toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateStr = timestamp.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const subject = `🚨 RODE melding - ${participantName} voelt zich niet goed`;
    const htmlBody = `
      <h2>🚨 EmotieCheck Dagbesteding - RODE Melding</h2>
      <p><strong>${participantName}</strong> heeft aangegeven zich <strong>niet goed</strong> te voelen.</p>
      <ul>
        <li><strong>Deelnemer:</strong> ${participantName}</li>
        <li><strong>Datum:</strong> ${dateStr}</li>
        <li><strong>Tijd:</strong> ${timeStr}</li>
        <li><strong>Status:</strong> 🔴 Rood - Actie vereist</li>
      </ul>
      <p>Controleer alsjeblieft hoe het met ${participantName} gaat.</p>
      <hr>
      <p style="color:#666;font-size:12px;">Dit bericht is automatisch verstuurd door de EmotieCheck app.</p>
    `;
    const textBody =
      `🚨 EmotieCheck Dagbesteding - RODE Melding\n\n` +
      `${participantName} heeft aangegeven zich niet goed te voelen.\n\n` +
      `Datum: ${dateStr}\n` +
      `Tijd: ${timeStr}\n\n` +
      `Controleer alsjeblieft hoe het met ${participantName} gaat.`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "EmotieCheck <melding@emotiecheck.app>",
        to: [toEmail],
        subject: subject,
        html: htmlBody,
        text: textBody,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || `Email error: ${response.status}`,
      };
    }

    return { success: true, message: "Email melding verstuurd!" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendTestEmail(
  toEmail: string,
  resendApiKey: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "EmotieCheck <onboarding@resend.dev>",
        to: [toEmail],
        subject: "✅ EmotieCheck - Testmelding",
        html: `<h2>✅ Test geslaagd!</h2><p>Je email meldingen voor EmotieCheck werken correct.</p>`,
        text: "Test geslaagd! Je email meldingen werken correct.",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || `Email error: ${response.status}`,
      };
    }

    return { success: true, message: "Test email verstuurd!" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
