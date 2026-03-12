export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startTelegramCron } = await import("./lib/telegram-cron");
    startTelegramCron();
  }
}
