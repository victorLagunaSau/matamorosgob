import OpenAI from "openai";

const openai = new OpenAI({
  apiKey:  process.env.OPENAI_API_KEY,
});

(async () => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Puedes darme datos de una localidad" }],
      max_tokens: 5,
    });
    console.log("Respuesta:", response.choices[0].message.content.trim());
  } catch (error) {
    console.error("Error durante la solicitud:", error.message);
  }
})();