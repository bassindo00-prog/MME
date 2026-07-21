"use server";

import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function getTelegramSettingsAction() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const settings = await prisma.settings.findMany({
      where: {
        key: { in: ['telegram_enabled', 'telegram_bot_token', 'telegram_chat_id'] }
      }
    });

    const config = {
      enabled: false,
      botToken: "",
      chatId: ""
    };

    settings.forEach(s => {
      if (s.key === 'telegram_enabled') config.enabled = s.value === 'true';
      if (s.key === 'telegram_bot_token') config.botToken = s.value;
      if (s.key === 'telegram_chat_id') config.chatId = s.value;
    });

    return { data: config };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function saveTelegramSettingsAction(
  enabled: boolean, 
  botToken: string, 
  chatId: string, 
  originUrl: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await prisma.$transaction([
      prisma.settings.upsert({
        where: { key: 'telegram_enabled' },
        update: { value: enabled.toString() },
        create: { key: 'telegram_enabled', value: enabled.toString(), description: 'Enable Telegram Notifications' }
      }),
      prisma.settings.upsert({
        where: { key: 'telegram_bot_token' },
        update: { value: botToken },
        create: { key: 'telegram_bot_token', value: botToken, description: 'Telegram Bot Token' }
      }),
      prisma.settings.upsert({
        where: { key: 'telegram_chat_id' },
        update: { value: chatId },
        create: { key: 'telegram_chat_id', value: chatId, description: 'Telegram Chat ID' }
      })
    ]);

    // If enabled, register the webhook automatically
    if (enabled && botToken) {
      const webhookUrl = `${originUrl}/api/telegram/webhook`;
      const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
      const data = await res.json();
      if (!data.ok) {
        console.error("Failed to set Telegram webhook:", data);
        return { error: `Gagal mengatur Webhook Telegram: ${data.description}` };
      }
    } else if (!enabled && botToken) {
      // Unregister webhook
      await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`);
    }

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function testTelegramConnectionAction(botToken: string, chatId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  if (!botToken || !chatId) {
    return { error: "Bot Token dan Chat ID harus diisi." };
  }

  try {
    const text = "🤖 *Test Connection MME Music*\nKoneksi Telegram Bot berhasil dihubungkan ke sistem CMS!";
    
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown"
      })
    });

    const data = await res.json();
    if (!data.ok) {
      return { error: `Telegram API Error: ${data.description}` };
    }

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
