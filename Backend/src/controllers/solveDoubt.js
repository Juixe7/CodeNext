const axios = require('axios');

const solveDoubt = async (req, res) => {
    try {
        const { messages, title, description, testCases, startCode } = req.body;

        const hfToken = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
        
        if (!hfToken) {
            return res.status(400).json({ message: "HF_TOKEN is not configured on the server." });
        }

        const systemInstruction = `You are an expert DSA tutor helping with the following problem.
Problem: ${title}
Description: ${description}
Only help with DSA topics related to this problem. Be concise and educational.`;

        const apiMessages = [
            { role: "system", content: systemInstruction },
            ...messages.map(m => ({
                role: m.role === 'assistant' || m.role === 'model' ? 'assistant' : 'user',
                content: m.content || ''
            }))
        ];

        // HuggingFace unified OpenAI-compatible endpoint
        // Docs: https://huggingface.co/docs/api-inference/tasks/chat-completion
        const response = await axios.post(
            'https://api-inference.huggingface.co/v1/chat/completions',
            {
                model: "microsoft/Phi-3-mini-4k-instruct",
                messages: apiMessages,
                max_tokens: 800,
                temperature: 0.5
            },
            {
                headers: {
                    'Authorization': `Bearer ${hfToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 120000
            }
        );

        const reply = response.data.choices[0].message.content;
        res.status(200).json({ message: reply });
        
    } catch(err) {
        const errData = err.response?.data;
        console.error("AI API Error:", JSON.stringify(errData) || err.message);
        const errMsg = errData?.error || err.message || "Unknown error";
        res.status(500).json({
            message: `AI Error: ${errMsg}`
        });
    }
}

module.exports = solveDoubt;
