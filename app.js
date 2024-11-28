const express = require('express');
const twilio = require('twilio');
const axios = require('axios'); // Para interactuar con la API de OpenAI
require('dotenv').config();

const app = express();
app.use(express.json());

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);

// Endpoint para recibir mensajes de WhatsApp
app.post('/webhook', async (req, res) => {
    const incomingMessage = req.body.Body; // Mensaje recibido
    const sender = req.body.From; // Número del remitente

    console.log(`Mensaje recibido: ${incomingMessage} de ${sender}`);

    try {
        // Responder con un mensaje estático ("Hola amigo") para la validación
        const responseMessage = "Hola amigo";
        console.log(`Enviando respuesta: ${responseMessage}`);

        // Enviar la respuesta al usuario de WhatsApp
        await sendWhatsAppMessage(sender, responseMessage);
        console.log('Respuesta enviada correctamente');

        res.status(200).send('Mensaje procesado'); // Respuesta con código 200
    } catch (err) {
        console.error('Error procesando el mensaje:', err);
        res.status(500).send('Error interno del servidor'); // Respuesta con código 500 en caso de error
    }
});

// Escuchar en el puerto 3000
app.listen(3000, () => {
    console.log('Servidor montado en el puerto 3000');
});

// Función para enviar mensajes de WhatsApp
async function sendWhatsAppMessage(to, message) {
    try {
        console.log(`Enviando mensaje de WhatsApp a ${to} con el mensaje: "${message}"`);
        await twilioClient.messages.create({
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            body: message,
            to: `whatsapp:+${to}`,
        });
    } catch (err) {
        console.error('Error al enviar mensaje de WhatsApp:', err);
    }
}
