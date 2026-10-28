import "dotenv/config";
import express from "express";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.OPENAI_API_KEY) {
  console.error("ERROR: Falta OPENAI_API_KEY.");
  console.error("Crea un archivo .env y agrega: OPENAI_API_KEY=tu_clave");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

app.get("/api/estado", (req, res) => {
  res.json({ ok: true, servidor: "Biblioteca Digital Dinamarca" });
});

app.post("/api/chat", async (req, res) => {
  try {
    const messages = Array.isArray(req.body.messages) ? req.body.messages : [];

    const safe = messages
      .filter(
        m =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string"
      )
      .slice(-20);

    if (!safe.length) {
      return res.status(400).json({
        error: "No se recibió ninguna pregunta."
      });
    }

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      instructions: `
Eres el Asistente IA de la Biblioteca Digital Dinamarca de la Institución Educativa Dinamarca.

Ayudas a estudiantes con preguntas académicas, explicaciones y orientación sobre los recursos de la biblioteca.

Puedes ayudar con:
- Historia
- Biología
- Matemáticas
- Química
- Literatura

Responde siempre en español claro y apropiado para estudiantes.
Explica paso a paso cuando sea útil.
No inventes datos sobre libros, autores o información institucional.
Si no sabes un dato específico de la biblioteca, dilo claramente.
      `,
      input: safe,
      max_output_tokens: 700
    });

    res.json({
      answer: response.output_text || "No se obtuvo una respuesta."
    });
  } catch (error) {
    console.error("ERROR DE OPENAI:", error);

    const mensaje = error?.message || "Error desconocido";

    res.status(500).json({
      error: "Error del servidor al comunicarse con OpenAI: " + mensaje
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
