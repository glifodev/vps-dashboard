import { config } from "./config";

export async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${config.evoApiUrl}/message/sendText/${config.evoInstance}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: config.evoApiKey },
        body: JSON.stringify({ number: phone, text: message }),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function getWhatsAppStatus(): Promise<{ connected: boolean; name: string; number: string }> {
  try {
    const res = await fetch(`${config.evoApiUrl}/instance/fetchInstances`, {
      headers: { apikey: config.evoApiKey },
    });
    const data = await res.json();
    const instance = data.find((i: { name: string }) => i.name === config.evoInstance);
    return {
      connected: instance?.connectionStatus === "open",
      name: instance?.profileName ?? "",
      number: instance?.ownerJid?.replace("@s.whatsapp.net", "") ?? "",
    };
  } catch {
    return { connected: false, name: "", number: "" };
  }
}
