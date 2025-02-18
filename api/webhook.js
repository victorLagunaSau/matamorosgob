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
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { Body: incomingMessage, From: sender } = req.body; // Datos enviados por Twilio

  try {
    // Procesar el mensaje con OpenAI
    const openaiResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Modelo de OpenAI para enriquecer la respuesta
      messages: [
        { role: "system", content: "Eres un asistente amable y claro para emergencias en Matamoros, Tamaulipas, preséntate como RIGO" },
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

    res.status(200).json({ message: "Mensaje procesado correctamente" });
  } catch (error) {
    console.error("Error procesando la solicitud:", error.message);

    // Respuesta en caso de error
    res.status(500).json({
      error: "Ocurrió un problema al procesar tu solicitud.",
      details: error.message,
    });
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
