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

        // Build prompt in Mistral instruct format: <s>[INST] ... [/INST]
        let prompt = `<s>[INST] ${systemInstruction}\n\n`;
        
        for (let i = 0; i < messages.length; i++) {
            const m = messages[i];
            const isUser = m.role === 'user';
            if (isUser) {
                if (i === 0) {
                    prompt += `${m.content} [/INST]`;
                } else {
                    prompt += ` [INST] ${m.content} [/INST]`;
                }
            } else {
                prompt += ` ${m.content} </s>`;
            }
        }

        const response = await axios.post(
            'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
            {
                inputs: prompt,
                parameters: {
                    max_new_tokens: 800,
                    temperature: 0.5,
                    return_full_text: false
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${hfToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            }
        );

        let reply = '';
        if (Array.isArray(response.data) && response.data[0]?.generated_text) {
            reply = response.data[0].generated_text.trim();
        } else if (response.data?.generated_text) {
            reply = response.data.generated_text.trim();
        } else {
            reply = "I received a response but couldn't parse it. Please try again.";
        }
        
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
