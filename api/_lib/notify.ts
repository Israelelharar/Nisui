/**
 * Sends one short message to the admin on every channel that is configured:
 * WhatsApp (CallMeBot), e-mail (Resend) and/or push (ntfy).
 */
export async function notifyAdmin(text: string) {
  const env = process.env;
  const jobs: Promise<unknown>[] = [];

  if (env.CALLMEBOT_APIKEY && env.NOTIFY_WHATSAPP) {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(env.NOTIFY_WHATSAPP)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(env.CALLMEBOT_APIKEY)}`;
    jobs.push(fetch(url));
  }
  if (env.RESEND_API_KEY && env.NOTIFY_EMAIL) {
    jobs.push(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: `${process.env.NOTIFY_FROM_NAME ?? 'העולם שלנו'} <onboarding@resend.dev>`, to: env.NOTIFY_EMAIL, subject: text, text }),
      }),
    );
  }
  if (env.NTFY_TOPIC) {
    jobs.push(fetch(`https://ntfy.sh/${encodeURIComponent(env.NTFY_TOPIC)}`, { method: 'POST', body: text }));
  }

  const results = await Promise.allSettled(jobs);
  return { channels: jobs.length, failed: results.filter((r) => r.status === 'rejected').length };
}

export const notifyChannels = () => ({
  whatsapp: !!(process.env.CALLMEBOT_APIKEY && process.env.NOTIFY_WHATSAPP),
  email: !!(process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL),
  push: !!process.env.NTFY_TOPIC,
});
