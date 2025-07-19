const axios = require('axios');

const solveDoubt = async (req, res) => {
    try {
        const { messages, title, description, testCases, startCode } = req.body;

        const groqApiKey = process.env.GROQ_API_KEY;
        
        if (!groqApiKey) {
            return res.status(400).json({ 
                message: "GROQ_API_KEY is not configured. Please add it to your Render environment variables." 
            });
        }

        const systemInstruction = `You are an expert Data Structures and Algorithms (DSA) tutor. 
You are helping the user with the following coding problem:

Problem: ${title}
Description: ${description}

Your role:
- Give hints and guide the user without directly giving complete solutions (unless explicitly asked)
- Explain time/space complexity
- Help debug their code if they share it
- Be concise, friendly, and educational
- ONLY help with topics related to this DSA problem`;

        // Build OpenAI-compatible messages array
        const apiMessages = [
            { role: "system", content: systemInstruction },
            ...messages
                .filter(m => m.content && m.content.trim())
                .map(m => ({
                    role: m.role === 'assistant' || m.role === 'model' ? 'assistant' : 'user',
                    content: m.content.trim()
                }))
        ];

        // Groq API - Free, fast, OpenAI-compatible
        // Models: llama-3.1-8b-instant, llama3-8b-8192, gemma2-9b-it, mixtral-8x7b-32768
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: "llama-3.1-8b-instant",
                messages: apiMessages,
                max_tokens: 1000,
                temperature: 0.5
            },
            {
                headers: {
                    'Authorization': `Bearer ${groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // Groq is fast, 30s is more than enough
            }
        );

        const reply = response.data.choices[0].message.content;
        res.status(200).json({ message: reply });
        
    } catch(err) {
        const errData = err.response?.data;
        const status = err.response?.status;
        console.error("Groq API Error:", status, JSON.stringify(errData) || err.message);
        
        const errMsg = errData?.error?.message || err.message || "Unknown error";
        res.status(500).json({
            message: `AI Error: ${errMsg}`
        });
    }
}

module.exports = solveDoubt;
