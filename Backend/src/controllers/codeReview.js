const axios = require('axios');

const reviewCode = async (req, res) => {
    try {
        const { code, language, problemTitle, problemDescription, status, testCasesPassed, testCasesTotal } = req.body;
        const groqApiKey = process.env.GROQ_API_KEY;

        if (!groqApiKey) {
            return res.status(400).json({ message: 'GROQ_API_KEY not configured.' });
        }

        const resultContext = status === 'accepted'
            ? `The code was ACCEPTED (${testCasesPassed}/${testCasesTotal} test cases passed).`
            : `The code FAILED (${testCasesPassed}/${testCasesTotal} test cases passed).`;

        const prompt = `You are an expert software engineer reviewing a DSA solution.

Problem: ${problemTitle}
Description: ${problemDescription}
Language: ${language}
Result: ${resultContext}

Code submitted:
\`\`\`${language}
${code}
\`\`\`

Provide a concise code review covering:
1. **Time Complexity** — Big O notation with explanation
2. **Space Complexity** — Big O notation with explanation
3. **Code Quality** — Readability, naming, edge cases handled
4. **Optimization** — Any better approach? (Only if significantly better)
5. **Summary** — One sentence verdict

Be direct and educational. Format with markdown headers and code examples where helpful.`;

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.1-8b-instant',
                messages: [
                    { role: 'system', content: 'You are a senior software engineer providing concise, educational code reviews for DSA solutions.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 1000,
                temperature: 0.3,
            },
            {
                headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
                timeout: 30000,
            }
        );

        const review = response.data.choices[0].message.content;
        res.status(200).json({ review });

    } catch (err) {
        const errMsg = err.response?.data?.error?.message || err.message;
        res.status(500).json({ message: `Review failed: ${errMsg}` });
    }
};

module.exports = { reviewCode };
