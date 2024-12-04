import OpenAI from "openai";
import twilio from "twilio";

// Cargar variables de entorno (en Vercel se inyectan automáticamente)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Llave configurada en Vercel
});

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { Body: incomingMessage, From: sender } = req.body; // Datos enviados por Twilio

  try {
    // Procesar el mensaje con OpenAI
    const openaiResponse = await openai.chat.completions.create({
      model: process.env.GPT_MODEL || "gpt-3.5-turbo",
      messages: [{ role: "user", content: incomingMessage }],
      max_tokens: 100,
    });

    const aiResponse = openaiResponse.choices[0].message.content.trim();

    // Responder al usuario vía Twilio
    await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER, // Tu número Twilio
      body: aiResponse,
      to: sender,
    });

    // Responder éxito a Twilio
    res.status(200).json({ message: "Mensaje procesado correctamente" });
  } catch (error) {
    console.error("Error procesando el mensaje:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}
