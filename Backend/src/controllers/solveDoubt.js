const axios = require('axios');

const solveDoubt = async (req, res) => {
    try {
        const { messages, title, description, testCases, startCode } = req.body;

        const systemInstruction = `
You are an expert Data Structures and Algorithms (DSA) tutor specializing in helping users solve coding problems. Your role is strictly limited to DSA-related assistance only.

## CURRENT PROBLEM CONTEXT:
[PROBLEM_TITLE]: ${title}
[PROBLEM_DESCRIPTION]: ${description}
[EXAMPLES]: ${JSON.stringify(testCases)}
[startCode]: ${JSON.stringify(startCode)}

## YOUR CAPABILITIES:
1. **Hint Provider**: Give step-by-step hints without revealing the complete solution
2. **Code Reviewer**: Debug and fix code submissions with explanations
3. **Solution Guide**: Provide optimal solutions with detailed explanations
4. **Complexity Analyzer**: Explain time and space complexity trade-offs
5. **Approach Suggester**: Recommend different algorithmic approaches (brute force, optimized, etc.)

## INTERACTION GUIDELINES:
- Break down the problem into smaller sub-problems when giving hints.
- Do NOT provide the complete code immediately unless explicitly asked for the "Optimal Solution".
- Use clear, concise explanations and format code with proper Markdown syntax highlighting.
- Always respond in the Language the user is asking about.
- If asked about non-DSA topics, politely decline.
`;

        // Format messages for OpenAI-compatible HF API
        const apiMessages = [
            { role: "system", content: systemInstruction },
            ...messages.map(m => ({
                role: m.role === 'assistant' || m.role === 'model' ? 'assistant' : 'user',
                content: m.content || ''
            }))
        ];

        // We will use Qwen2.5-Coder-32B-Instruct from HuggingFace
        const hfToken = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
        
        if (!hfToken) {
            return res.status(400).json({ message: "Please add HF_TOKEN to your backend .env file." });
        }

        const response = await axios.post(
            'https://api-inference.huggingface.co/models/Qwen/Qwen2.5-Coder-32B-Instruct/v1/chat/completions',
            {
                model: "Qwen/Qwen2.5-Coder-32B-Instruct",
                messages: apiMessages,
                max_tokens: 1500,
                temperature: 0.5
            },
            {
                headers: {
                    'Authorization': `Bearer ${hfToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const reply = response.data.choices[0].message.content;
        
        res.status(200).json({
            message: reply
        });
        
    } catch(err) {
        console.error("AI API Error:", err.response?.data || err.message);
        res.status(500).json({
            message: "Internal server error connecting to Hugging Face AI endpoint."
        });
    }
}

module.exports = solveDoubt;
