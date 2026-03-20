require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const PORT = 3000;

// 🔎 SerpAPI
async function fetchSearchResults(query) {
    try {
        const response = await axios.get("https://serpapi.com/search.json", {
            params: {
                q: query,
                api_key: process.env.SERPAPI_KEY,
                num: 5
            }
        });

        const results = response.data.organic_results || [];

return results.map(r => ({
    title: r.title,
    snippet: r.snippet,
    link: r.link
}));
    } catch (error) {
        console.error("SerpAPI Error:", error.message);
        return [];
    }
}

// 🧠 OpenRouter
async function analyzeWithOpenRouter(text, searchResults) {
    try {
        const context = searchResults.map(r =>
            `Title: ${r.title}\nSnippet: ${r.snippet}`
        ).join("\n\n");

        const prompt = `
You are a fact-checking AI.

User Statement:
"${text}"

Web Evidence:
${context}

Instructions:
- Decide if the statement is TRUE or FALSE
- Give confidence (0 to 1)
- Explain clearly

Return ONLY valid JSON. Do not include any extra text before or after JSON.

Strict format:
{
  "verdict": "true" or "false",
  "confidence": number,
  "reason": "string"
}
`;

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                temperature: 0
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const output = response.data.choices[0].message.content;

console.log("🧠 RAW AI OUTPUT:\n", output);

// ✅ Extract JSON safely
let parsed;

try {
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch[0]);
} catch (e) {
    console.log("❌ JSON Parse Failed");

    parsed = {
        verdict: "unknown",
        confidence: 0.5,
        reason: "AI response format error"
    };
}

return parsed;

    } catch (error) {
        console.error("OpenRouter Error:", error.message);
        return {
            verdict: "unknown",
            confidence: 0.5,
            reason: "Analysis failed"
        };
    }
}

// 🚀 API Route
app.post("/analyze", async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: "No input text" });
    }

    try {
        const searchResults = await fetchSearchResults(text);
        const analysis = await analyzeWithOpenRouter(text, searchResults);

        res.json({
            input: text,
            searchResults,
            analysis
        });

    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
