// backend/index.js
require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const routes = require('./routes'); // Import the routes/index.js file

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
        // Fetch 10 random documents
        const documents = await Document.aggregate([{ $sample: { size: 10 } }]);

        if (documents.length > 0) {
            // Prepare email content
            let emailContent = 'Here are the randomly selected MCQs for today!\n\n';
            documents.forEach(doc => {
                emailContent += `${doc.longtext}\n\n`;
            });

            emailContent += 'Best Regards,\n\nMCQs Generator!\n';

            // Send email
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.RECIPIENT_EMAIL, // Recipient's email address
                subject: 'Random Practice MCQs',
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

    // Middleware setup
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cors());
    app.use(bodyParser.json());

    // Use the combined routes
    app.use(routes);

    // Schedule the task to run every 12 hours
    cron.schedule('0 */12 * * *', fetchDocumentsAndSendEmail);

    // Start the server after the database is connected
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Backend server running at port: ${PORT}`);
    });
}

// Call the function to start the server
startServer().catch(err => {
    console.error('Error starting the server:', err);
});
