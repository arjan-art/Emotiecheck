export async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string,
  apiKey?: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const encodedMessage = encodeURIComponent(message);
    const url = apiKey
      ? `https://api.callmebot.com/whatsapp.php?phone=${phoneNumber}&text=${encodedMessage}&apikey=${apiKey}`
      : `https://api.callmebot.com/whatsapp.php?phone=${phoneNumber}&text=${encodedMessage}&apikey=9857237`; // default free key

    const response = await fetch(url);
    const text = await response.text();

    if (text.includes("APIKey")) {
      return {
        success: false,
        message:
          "Invalid API key. User must get their own API key from CallMeBot.",
      };
    }

    return { success: true, message: "WhatsApp message sent successfully" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function buildRedAlertMessage(
  timestamp: Date,
  participantName?: string | null,
): string {
  const timeStr = timestamp.toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const name = participantName?.trim();
  if (name) {
    return `🚨 EmotieCheck dagbesteding — ${name} heeft aangegeven zich niet goed te voelen om ${timeStr}. Controleer alsjeblieft.`;
  }
  return `🚨 EmotieCheck dagbesteding — Een deelnemer heeft aangegeven zich niet goed te voelen om ${timeStr}. Controleer alsjeblieft.`;
}
