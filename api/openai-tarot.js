export default async function handler(req, res) {
  // Allow POST only
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Allow calls from your site
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { type, imagePrompt, readingPayload } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    if (type === "image") {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: imagePrompt,
          size: "1024x1536"
        })
      });

      const data = await response.json();
      const url = data?.data?.[0]?.url || null;
      return res.status(200).json({ imageUrl: url });
    }

    if (type === "reading") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a tarot reader with a cosmic neon, romantic, shadow-aware voice. " +
                "Your readings feel cinematic, mythic, and emotionally intelligent."
            },
            {
              role: "user",
              content:
                `Archetype: ${readingPayload.archetype}\n` +
                `Mood: ${readingPayload.mood}\n` +
                `Character: ${readingPayload.character}\n` +
                `Symbols: ${readingPayload.symbols}\n` +
                `Palette: ${readingPayload.palette}\n` +
                `Intention: ${readingPayload.intention}`
            }
          ],
          temperature: 0.9
        })
      });

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content || null;
      return res.status(200).json({ readingText: text });
    }

    return res.status(400).json({ error: "Invalid type" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}