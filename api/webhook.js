import OpenAI from "openai";
import twilio from "twilio";

// Configuración de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Llave configurada en el archivo .env
});

// Configuración de Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Números de contacto específicos de Matamoros
const emergencyContacts = {
  "policía": "Policía de Matamoros: 911 y (868) 810 8000",
  "bomberos": "Bomberos de Matamoros: 911",
  "cruz roja": "Cruz Roja Matamoros: (868) 812 0911",
  "protección civil": "Protección Civil Matamoros: (868) 810 8000 (pide conectar con el área correspondiente)",
};

// Límite de caracteres para las respuestas
const MAX_CHARACTERS = 390;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Content-Type", "application/json");
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { Body: incomingMessage, From: sender } = req.body || {};

  // Validar que los datos necesarios están presentes
  if (!incomingMessage || !sender) {
    res.setHeader("Content-Type", "application/json");
    return res.status(400).json({ error: "Invalid request body" });
  }

  try {
    // Procesar el mensaje con OpenAI
    const openaiResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Modelo de OpenAI para enriquecer la respuesta
      messages: [
        { role: "system", content: "Eres un asistente amable y claro para emergencias en Matamoros, Tamaulipas." },
        { role: "user", content: incomingMessage },
      ],
      max_tokens: 150,
    });

    let aiResponse = openaiResponse.choices[0].message.content.trim();

    // Si OpenAI no puede responder, usamos la lógica local
    if (!aiResponse) {
      aiResponse = generateResponse(incomingMessage);
    }

    // Limitar la respuesta a 390 caracteres
    const limitedResponse = aiResponse.slice(0, MAX_CHARACTERS);

    // Enviar respuesta al usuario vía Twilio
    await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER, // Número configurado en .env
      body: limitedResponse,
      to: sender,
    });

    // Responder a Twilio con éxito
    res.setHeader("Content-Type", "text/plain");
    res.status(200).send("Mensaje procesado correctamente");
  } catch (error) {
    console.error("Error procesando la solicitud:", error.message);

    // Responder a Twilio en caso de error
    res.setHeader("Content-Type", "text/plain");
    res.status(500).send("Ocurrió un problema al procesar tu solicitud.");
  }
}

// Función para generar respuestas locales basadas en palabras clave
function generateResponse(message) {
  const lowerCaseMessage = message.toLowerCase();

  if (lowerCaseMessage.includes("policía")) {
    return emergencyContacts["policía"];
  } else if (lowerCaseMessage.includes("bomberos")) {
    return emergencyContacts["bomberos"];
  } else if (lowerCaseMessage.includes("cruz roja")) {
    return emergencyContacts["cruz roja"];
  } else if (lowerCaseMessage.includes("protección civil")) {
    return emergencyContacts["protección civil"];
  } else {
    return `Lo siento, no entiendo tu solicitud. Por favor, pregunta específicamente por "policía", "bomberos", "Cruz Roja" o "Protección Civil".`;
  }
}