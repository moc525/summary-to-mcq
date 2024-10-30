// backend/index.js
require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

const Document = require('./models/Document');
const app = express();

// Connect to the gmail server
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service (Gmail, Outlook, etc.)
    auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PWD, // Your email password or app-specific password
    },
});

// Access the environment variables
const API_KEY = process.env.OPENAI_MODEL_KEY;
const MODEL_NAME = process.env.OPENAI_MODEL_NAME;

async function fetchDocumentsAndSendEmail() {
    try {
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000); // Calculate the timestamp for 12 hours ago
        const documents = await Document.find({ timestamp: { $gte: twelveHoursAgo } }); // Fetch documents

        if (documents.length > 0) {
            // Prepare email content
            let emailContent = 'MCQs created in the last 12 hours:\n\n';
            documents.forEach(doc => {
                emailContent += `ID: ${doc.id},\nContent:\n\n${doc.longtext}\n\n\n`;
            });

            // Send email
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.RECIPIENT_EMAIL, // Recipient's email address
                subject: 'MCQs from the last 12 hours',
                text: emailContent,
            };

            await transporter.sendMail(mailOptions);
            console.log('Email sent successfully!');
        } else {
            console.log('No MCQs found in the last 12 hours.');
        }
    } catch (error) {
        console.error('Error fetching MCQs or sending email:', error);
    }
}

async function startServer() {
    // Connect to the database and wait for it to complete
    await connectDB();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));  // Add this line
    app.use(cors());
    app.use(bodyParser.json());

    app.options('/api/your-endpoint', (req, res) => {
        res.header('Access-Control-Allow-Origin', '*'); // or specify your frontend URL
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        res.sendStatus(200);
    });

    // Endpoint
    // Wildcard GET route
    app.get('*', async (req, res) => {
        res.send('Hello World! The app is up and running'); // Respond with "Hello World"
    });

    // New endpoint for summarizeParaToMcq
    app.post('/api/generatemcqs', async (req, res) => {
        const paragraph = req.body.paragraph;

        if (!paragraph) {
            return res.status(400).json({ error: "Paragraph is required" });
        }

        const prompt = `Create 10 engaging multiple-choice questions (MCQs) based on the paragraph at the end. Each question should contain 3 choices and is designed to assess the critical thinking and comprehension skills of 8th-grade students in the Norwegian region. 

                        Consider the following criteria for the content generation:
                        - Output should be in Nowegian language.
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
            console.log(data.choices.length, " ", data.choices);

            // Check if the choices array exists and has items
            if (data.choices && data.choices.length > 0) {

                const content = data.choices[0].message.content;

                const newDocument = new Document({ longtext: content });
                await newDocument.save();

                console.log('MCQs generated successfully!');
                res.send({ success: true, message: 'MCQs inserted into the DB!' });
            } else {
                console.error("No choices available in the response.");
                res.send({ success: false, message: "MCQs could not be generated!" });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    });

    // Schedule the task to run every 12 hours
    cron.schedule('0 */12 * * *', fetchDocumentsAndSendEmail);

    // Start the server after the database is connected
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Backend server running at http://localhost:${PORT}`);
    });
}

// Call the function to start the server
startServer().catch(err => {
    console.error('Error starting the server:', err);
});
