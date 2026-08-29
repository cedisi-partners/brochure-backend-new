const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// ========================================
// Health Check
// ========================================
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Brochure backend is running"
    });
});

// ========================================
// Send Brochure
// ========================================
app.post("/send_brochure", async (req, res) => {
    try {
        const { name, email, phoneNumber } = req.body;

        console.log("name:", name);
        console.log("email:", email);
        console.log("phoneNumber:", phoneNumber);

        // Validate required fields
        if (!name || !email || !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        // PDF URL
        const PDF_URL =
            "https://pub-3a8504c29aee40d6893dac5c9534e027.r2.dev/gfa/FinTech%20for%20Microfinance%20Program_Brochure.pdf";

        // Fetch PDF
        const pdfResponse = await fetch(PDF_URL);

        if (!pdfResponse.ok) {
            throw new Error("Failed to fetch PDF");
        }

        // Convert PDF to Buffer
        const pdfBuffer = Buffer.from(
            await pdfResponse.arrayBuffer()
        );

        // Convert PDF to Base64
        const pdfBase64 = pdfBuffer.toString("base64");

        // Send email through Resend
        const { data, error } = await resend.emails.send({
            from: "Global FinTech Academy <no-reply@contact.cedisipartners.com>",
            to: [email],
            subject: "Your Global FinTech Academy Program Brochure",

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                ">
                    <h2>Hello ${name},</h2>

                    <p>
                        Thank you for your interest in our program!
                        Here's your requested program brochure.
                    </p>

                    <p>
                        The PDF brochure is attached to this email.
                    </p>

                    <p>
                        Best regards,<br>
                        <strong>Global FinTech Academy</strong>
                    </p>
                </div>
            `,

            attachments: [
                {
                    filename: "program-brochure.pdf",
                    content: pdfBase64
                }
            ]
        });

        // Resend error
        if (error) {
            console.error("Resend error:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to send email",
                error
            });
        }

        // Success
        return res.status(200).json({
            success: true,
            message: "Brochure sent successfully",
            data
        });

    } catch (err) {
        console.error("Internal server error:", err);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// Export app for Vercel
module.exports = app;