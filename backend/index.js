// backend/index.js
require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const cors = require('cors');
const app = express();


// Access the environment variables
const PORT = process.env.PORT || 5000;
const DATABASE_URL = process.env.DATABASE_URL;
const API_KEY = process.env.OPENAI_MODEL_KEY;
const MODEL_NAME = process.env.OPENAI_MODEL_NAME;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));  // Add this line
app.use(cors());

// New endpoint for summarizeParaToMcq
app.post('/api/generatemcqs', async (req, res) => {
    const paragraph = req.body.paragraph;
    
    if (!paragraph) {
        return res.status(400).json({ error: "Paragraph is required" });
    }

    const prompt = `Create 10 engaging multiple-choice questions (MCQs) based on the paragraph at the end. Each question should contain 3 choices and is designed to assess the critical thinking and comprehension skills of 8th-grade students in the Norwegian region. 

                        Consider the following criteria for the content generation:
                        - Contextually relevant to the provided paragraph, reflecting its themes and key points without being explicitly labeled as "fill in the blank" or "scenario-based."
                        - Properly formatted with clear spacing between each question to enhance readability.
                        - Make 60% MCQs descriptive scenario based and 40% fill in the blanks based.
                        - Make scenarios a little descriptive.
                        - Output should be in plain text format, not markdown.

                        The paragraph is as follows:

                        ${paragraph}`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        const data = await response.json();

        // Check if the choices array exists and has items
        if (data.choices && data.choices.length > 0) {
            console.log('MCQs generated successfully!');
            res.send({ success: true, message: 'MCQs inserted into the DB!' });
        } else {
            console.error("No choices available in the response.");
            res.send({ success: false, message: "MCQs could not be generated!" });
        }
    } catch (error) {
        console.error('Error summarizing paragraph to MCQ:', error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running at http://localhost:${PORT}`);
});
