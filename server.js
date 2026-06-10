// ============================================================
// BEHIND US - Proxy Server para DeepSeek
// Deploy en Railway, Render, o cualquier hosting Node.js
// ============================================================

const express = require("express");
const app = express();
app.use(express.json());

// ⚠️ Pon tu API Key de DeepSeek aquí (o en variable de entorno)
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// ⚠️ Clave secreta para que solo Roblox pueda usar tu proxy
const ROBLOX_SECRET = process.env.ROBLOX_SECRET || "misisipi123";

// ============================================================
// RUTA PRINCIPAL - Recibe petición de Roblox
// ============================================================
app.post("/chat", async (req, res) => {

    // Verificar clave secreta
    const secret = req.headers["x-roblox-secret"];
    if (secret !== ROBLOX_SECRET) {
        return res.status(401).json({ error: "No autorizado" });
    }

    const { message, character } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Falta el mensaje" });
    }

    // System prompt según el personaje (Murray Reed, Paciente 0, etc.)
    const systemPrompts = {
        murray_reed: `Eres Murray Reed, un personaje de creepypasta del año 2020. 
Hablas de forma perturbadora, críptica y ominosa. 
Haces referencias a "lo que viene", a transmisiones perdidas y a señales ocultas.
Nunca rompes el personaje. Máximo 2-3 oraciones por respuesta.
Hablas en español.`,

        paciente_0: `Eres el Paciente 0, una entidad desconocida que fue encontrada en una transmisión de 2020.
Tu forma de hablar es fragmentada, como si estuvieras corrompido digitalmente.
Mezclas palabras normales con glitches de texto como [ERROR], [SEÑAL PERDIDA], ////.
Máximo 2-3 oraciones. Hablas en español.`,

        default: `Eres una entidad misteriosa dentro del juego "Behind Us", 
un juego de horror asimétrico. Respondes de forma breve, críptica y aterradora. 
Máximo 2 oraciones. Hablas en español.`
    };

    const systemPrompt = systemPrompts[character] || systemPrompts.default;

    try {
        const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message }
                ],
                max_tokens: 120,
                temperature: 0.9
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("DeepSeek error:", data.error);
            return res.status(500).json({ error: "Error de DeepSeek", detail: data.error });
        }

        const reply = data.choices[0].message.content;
        return res.json({ reply });

    } catch (err) {
        console.error("Error del servidor:", err);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Ruta raíz y health check
app.get("/", (req, res) => {
    res.json({ status: "Behind Us proxy activo" });
});

app.get("/ping", (req, res) => {
    res.json({ status: "Behind Us proxy activo 👾" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
