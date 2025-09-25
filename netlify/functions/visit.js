const fetch = require("node-fetch");
const UAParser = require("ua-parser-js");

const parseBots = () => {
  if (process.env.BOTS_JSON) {
    return JSON.parse(process.env.BOTS_JSON);
  }
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
    const bots = parseBots();

    // Extract IP & User-Agent
    const ip =
      event.headers["x-nf-client-connection-ip"] ||
      event.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      event.headers["client-ip"] ||
      event.ip ||
      "Unknown IP";

    const userAgentStr = event.headers["user-agent"] || "Unknown browser";

    // Parse device info
    const parser = new UAParser(userAgentStr);
    const ua = parser.getResult();
    const deviceInfo = `
  📱 Device: ${ua.device.vendor || "Unknown"} ${ua.device.model || ""}
  💻 OS: ${ua.os.name || "Unknown"} ${ua.os.version || ""}
  🌐 Browser: ${ua.browser.name || "Unknown"} ${ua.browser.version || ""}
    `.trim();

    // Fetch geolocation data
    let location = "Unknown location";
    let isp = "Unknown ISP";
    try {
      const geoRes = await fetch(`https://ipinfo.io/${ip}/json?token=7a07409b5adbd9`);
      if (geoRes.ok) {
        const geo = await geoRes.json();
          if (geo.org) {
            isp = geo.org.replace(/^AS\d+\s*/, "");
          }
        if (geo.city && geo.country) {
          location = `${geo.city}, ${geo.country}`;
        } else if (geo.country) {
          location = geo.country;
        }
      }
    } catch (err) {
      console.error("Geo lookup failed:", err.message);
    }

    const msg = `👀 New visit to your site!
🌍 IP: ${ip}
📍 Location: ${location}
🏢 ISP: ${isp}
${deviceInfo}
🖥️ User-Agent: ${userAgentStr}
📄 Path: ${event.headers.referer || "/"}
🕒 Time: ${new Date().toLocaleString()}`;

    // Send to all bots
    await Promise.all(
      bots.map((b) =>
        fetch(`https://api.telegram.org/bot${b.token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: b.chatId, text: msg }),
        })
      )
    );

    return { statusCode: 200, body: "Visit logged" };
  } catch (err) {
    console.error("visit function error:", err.message);
    return { statusCode: 500, body: "Error" };
  }
};