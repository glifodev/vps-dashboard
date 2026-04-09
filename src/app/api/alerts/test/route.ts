import { NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { config } from "@/lib/config";

export async function POST() {
  const success = await sendWhatsAppMessage(config.alertPhone, "Teste de alerta do VPS Ops Dashboard. Tudo funcionando!");
  return NextResponse.json({ success });
}
