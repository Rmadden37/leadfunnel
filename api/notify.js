export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('Missing Telegram credentials');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const lead = req.body;

    // Escape Markdown special characters in user input
    const esc = (str) => (str || 'N/A').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');

    const message = `🔔 *New Solar Lead\\!*

👤 *Name:* ${esc(lead.name)}
📍 *Address:* ${esc(lead.address)}
🏙️ *City:* ${esc(lead.city)} ${esc(lead.zip)}
📞 *Phone:* ${esc(lead.phone)}
📧 *Email:* ${esc(lead.email)}
🔗 *Source:* ${esc(lead.source) || 'Website'}
🕐 *Time:* ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}`;

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'MarkdownV2'
      })
    });

    const result = await response.json();

    if (!result.ok) {
      console.error('Telegram API error:', result);
      return res.status(500).json({ error: 'Telegram send failed', details: result });
    }

    return res.status(200).json({ status: 'success', message: 'Notification sent' });

  } catch (error) {
    console.error('Notification error:', error);
    return res.status(500).json({ error: 'Failed to send notification' });
  }
}
