const axios = require('axios');

const solveDoubt = async (req, res) => {
    try {
        const { messages, title, description, testCases, startCode } = req.body;

        const hfToken = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
        
        if (!hfToken) {
            return res.status(400).json({ message: "HF_TOKEN is not configured on the server." });
        }

        const systemInstruction = `You are an expert DSA tutor. Problem: ${title}. ${description}. Only help with DSA topics. Be concise.`;

        // Build a simple chat prompt for Gemma
        let prompt = `<start_of_turn>user\n${systemInstruction}\n\n`;
        
        for (const m of messages) {
            if (m.role === 'user') {
                prompt += `<start_of_turn>user\n${m.content}<end_of_turn>\n`;
            } else {
                prompt += `<start_of_turn>model\n${m.content}<end_of_turn>\n`;
            }
        }
        prompt += `<start_of_turn>model\n`;

        // Use the basic text generation endpoint with google/gemma-2-2b-it
        // This is the most reliable free-tier HuggingFace endpoint
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/google/gemma-2-2b-it',
            {
                inputs: prompt,
                parameters: {
                    max_new_tokens: 600,
                    temperature: 0.5,
                    return_full_text: false
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${hfToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 120000
            }
        );

        let reply = '';
        if (Array.isArray(response.data) && response.data[0]?.generated_text) {
            reply = response.data[0].generated_text.trim();
        } else if (typeof response.data === 'string') {
            reply = response.data.trim();
        } else {
            reply = JSON.stringify(response.data);
        }

        // Clean up any leftover turn markers
        reply = reply.replace(/<end_of_turn>/g, '').replace(/<start_of_turn>/g, '').trim();
        
        res.status(200).json({ message: reply });
        
    } catch(err) {
        const errData = err.response?.data;
        const status = err.response?.status;
        console.error("AI API Error:", status, JSON.stringify(errData) || err.message);
        
        // Handle model loading (503)
        if (status === 503) {
            const wait = errData?.estimated_time || 30;
            return res.status(503).json({
                message: `AI model is loading (cold start). Please try again in ~${Math.ceil(wait)} seconds.`
            });
        }
        
        const errMsg = errData?.error || err.message || "Unknown error";
        res.status(500).json({
            message: `AI Error: ${errMsg}`
        });
    }
}

module.exports = solveDoubt;
