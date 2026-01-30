const fetch = require("node-fetch");

const parseBots = () => {
  if (process.env.BOTS) {
    return process.env.BOTS.split(",").map(pair => {
      const [token, chatId] = pair.split("@");
      return { token, chatId };
    });
  }
  throw new Error("No bots configured");
};

exports.handler = async () => {
  try {
    const bots = parseBots();

    const message = "✍️ A user started filling the form";

    await Promise.all(
      bots.map(b =>
        fetch(`https://api.telegram.org/bot${b.token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: b.chatId,
            text: message,
          }),
        })
      )
    );

    return { statusCode: 200, body: "Typing alert sent" };
  } catch (err) {
    console.error("typing function error:", err.message);
    return { statusCode: 500, body: "Error" };
  }
};