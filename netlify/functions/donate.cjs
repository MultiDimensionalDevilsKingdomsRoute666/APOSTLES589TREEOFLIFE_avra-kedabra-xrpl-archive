const DONATION_ADDRESS = "rQHERc4JCVRtoHvwnoeqoqc1GBgrXPDrLS";
const DONATION_AMOUNT_DROPS = "100000000"; // 100 XRP

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.XAMAN_API_KEY;
  const apiSecret = process.env.XAMAN_API_SECRET;
  if (!apiKey || !apiSecret) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server not configured" }) };
  }

  try {
    const response = await fetch("https://xumm.app/api/v1/platform/payload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        "X-API-Secret": apiSecret,
      },
      body: JSON.stringify({
        txjson: {
          TransactionType: "Payment",
          Destination: DONATION_ADDRESS,
          Amount: DONATION_AMOUNT_DROPS,
        },
      }),
    });

    if (!response.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: "Failed to create payment request" }) };
    }

    const data = await response.json();
    const qrPng = data?.refs?.qr_png;
    const deepLink = data?.next?.always;
    if (!qrPng || !deepLink) {
      return { statusCode: 502, body: JSON.stringify({ error: "Malformed response from Xaman" }) };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qrPng, deepLink }),
    };
  } catch {
    return { statusCode: 502, body: JSON.stringify({ error: "Failed to create payment request" }) };
  }
};
