// routes/mcqRoutes.js
const express = require('express');
const Document = require('../models/Document'); // Adjust path as necessary
const router = express.Router();

const API_KEY = process.env.OPENAI_MODEL_KEY;
const MODEL_NAME = process.env.OPENAI_MODEL_NAME;

function trimFirstAndLastLine(str) {
    // Split the string into an array of lines
    const lines = str.split('\n');

    // Check if the array has more than 2 lines
    if (lines.length <= 2) {
        // If there are 2 or fewer lines, return an empty string or the middle line
        return lines.length === 2 ? lines[1] : '';
    }

    // Remove the first and last line and join the remaining lines back into a string
    return lines.slice(1, -1).join('\n').trim();
}

// Endpoint
// Wildcard GET route
router.get('*', async (req, res) => {
    res.send('Hello World! The app is up and running!');
});

// New endpoint for summarizeParaToMcq
router.post('/api/generatemcqs', async (req, res) => {
    const paragraph = req.body.paragraph;

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    if (!paragraph) {
        return res.status(400).json({ error: 'Paragraph is required' });
    }

    const prompt = `Create 10 engaging multiple-choice questions (MCQs) based on the paragraph at the end. Each question should contain 3 choices and is designed to assess the critical thinking and comprehension skills of 8th-grade students in the Norwegian region. 

                        Consider the following criteria for the content generation:
                        - Output should be in Nowegian language.
                        - Contextually relevant to the provided paragraph, reflecting its themes and key points without being explicitly labeled as "fill in the blank" or "scenario-based."
                        - Properly formatted with clear spacing between each question to enhance readability.
                        - Make 60% MCQs descriptive scenario based and 40% fill in the blanks based.
                        - Make scenarios a more descriptive.
                        - Output should be a json array and should strictly follow the following convention,
                            [
                                {
                                    "mcq": "mcq #1 text and options"
                                },
                                {
                                    "mcq": "mcq #2 text and options"
                                },
                                {
                                    "mcq": "mcq #3 text and options"
                                },
                                ..
                                ..
                                {
                                    "mcq": "mcq #N text and options"
                                },
                            ]
                        - Options should be marked as (A), (B) and (C).
                        - MCQ question and all the options should be the value of "mcq" key object in the json array and it should be readiable as each element will be a separate document in MongoDB.

                        The paragraph is as follows:

                        ${paragraph}`;

    try {
        console.log('Sending request to OpenAI API...');

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

        console.log('Response received...\n', JSON.stringify(data));
        
        // Check if the choices array exists and has items
        if (data.choices && data.choices.length > 0) {

            const content = JSON.parse(trimFirstAndLastLine(data.choices[0].message.content));
            
            for (const item of content) {
                const mcq = new Document({ longtext: item.mcq });
                await mcq.save();     
            }

            console.log('MCQs generated successfully!');
            res.send({ success: true, message: 'MCQs inserted into the DB!' });
        } else {
            console.error('No choices available in the response.');
            res.send({ success: false, message: 'MCQs could not be generated!' });
        }
    } catch (error) {
        console.error(`Unexpected Error: ${error}`);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;
