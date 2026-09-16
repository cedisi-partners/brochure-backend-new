// const express = require("express");
// const cors = require("cors");
// const { Resend } = require("resend");
// const multer = require("multer");
// const { PrismaClient } = require("@prisma/client");
// const { PutObjectCommand } = require("@aws-sdk/client-s3");
// require("dotenv").config();
// const r2Client = require("./r2Client");

// const app = express();

// app.use(cors());
// app.use(express.json());

// const resend = new Resend(process.env.RESEND_API_KEY);
// const prisma = new PrismaClient();
// const upload = multer({
//     storage: multer.memoryStorage(),
//     limits: { fileSize: 10 * 1024 * 1024 },
//     fileFilter: (req, file, callback) => {
//         const isPdf = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
//         callback(null, isPdf);
//     }
// });

// // ========================================
// // Health Check
// // ========================================

// app.get("/", (req, res) => {
//     res.status(200).json({
//         success: true,
//         message: "Brochure backend is running"
//     });
// });

// // ========================================
// // Upload Brochure
// // ========================================

// app.post("/api/cms/upload-brochure", upload.single("brochure"), async (req, res) => {
//     try {
//         const { programSlug, programTitle } = req.body;

//         if (!req.file || !programSlug || !programTitle) {
//             return res.status(400).json({
//                 success: false,
//                 message: "brochure PDF, programSlug, and programTitle are required"
//             });
//         }

//         const safeSlug = programSlug.trim().replace(/[^a-zA-Z0-9-_]/g, "-");
//         const objectKey = `brochures/${safeSlug}-${Date.now()}.pdf`;

//         await r2Client.send(new PutObjectCommand({
//             Bucket: process.env.R2_BUCKET_NAME,
//             Key: objectKey,
//             Body: req.file.buffer,
//             ContentType: "application/pdf"
//         }));

//         const brochureUrl = `${process.env.R2_PUBLIC_URL.replace(/\/$/, "")}/${objectKey}`;
//         const program = await prisma.program.upsert({
//             where: { slug: programSlug.trim() },
//             update: { title: programTitle.trim(), brochureUrl },
//             create: { slug: programSlug.trim(), title: programTitle.trim(), brochureUrl }
//         });

//         return res.status(200).json({
//             success: true,
//             message: "Brochure uploaded successfully",
//             program
//         });
//     } catch (err) {
//         console.error("Brochure upload error:", err);

//         return res.status(500).json({
//             success: false,
//             message: "Failed to upload brochure"
//         });
//     }
// });

// // ========================================
// // Send Brochure
// // ========================================

// app.post("/api/send_brochure", async (req, res) => {
//     try {
//         const {
//             name,
//             email,
//             phoneNumber,
//             programSlug,
//             programTitle,
//             sendBrochure = true,
//             emailSubject,
//             emailMessage
//         } = req.body;

//         console.log("name:", name);
//         console.log("email:", email);
//         console.log("phoneNumber:", phoneNumber);

//         if (!name || !email || !phoneNumber) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Missing required fields"
//             });
//         }

//         let pdfBase64;
//         if (sendBrochure) {
//             if (!programSlug) {
//                 return res.status(400).json({
//                     success: false,
//                     message: "programSlug is required when sending a brochure"
//                 });
//             }

//             const program = await prisma.program.findUnique({
//                 where: { slug: programSlug.trim() }
//             });

//             if (!program || !program.brochureUrl) {
//                 return res.status(404).json({
//                     success: false,
//                     message: "Brochure not found for this program"
//                 });
//             }

//             const pdfResponse = await fetch(program.brochureUrl);

//             if (!pdfResponse.ok) {
//                 throw new Error("Failed to fetch PDF");
//             }

//             const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
//             pdfBase64 = pdfBuffer.toString("base64");
//         }

//         const { data, error } = await resend.emails.send({
//             from: "Global FinTech Academy <no-reply@contact.cedisipartners.com>",
//             to: [email],
//             subject: emailSubject || "Your Global FinTech Academy Program Brochure",

//             html: `
//                 <div style="
//                     font-family: Arial, sans-serif;
//                     max-width: 600px;
//                     margin: 0;
//                     padding: 20px;
//                 ">
//                     <h2>Hello ${name},</h2>

//                     <p>${emailMessage || "Thank you for your interest in our program! Here's your requested program brochure."}</p>

//                     ${sendBrochure ? "<p>The PDF brochure is attached to this email. For more information and to explore our other courses visit us at <a href=\"https://globalfintechacademy.net/\">https://globalfintechacademy.net/</a>.</p>" : "<p>We appreciate your interest and will get back to you shortly with further details.</p>"}

//                     <p>
//                         Best regards,<br>
//                         <strong>Global FinTech Academy</strong>
//                     </p>
//                 </div>
//             `,

//             ...(pdfBase64 ? {
//                 attachments: [
//                     {
//                         filename: "program-brochure.pdf",
//                         content: pdfBase64
//                     }
//                 ]
//             } : {})
//         });

//         if (error) {
//             console.error("Resend error:", error);

//             return res.status(500).json({
//                 success: false,
//                 message: "Failed to send email",
//                 error
//             });
//         }

//         return res.status(200).json({
//             success: true,
//             message: sendBrochure ? "Brochure sent successfully" : "Registration email sent successfully",
//             data
//         });

//     } catch (err) {
//         console.error("Internal server error:", err);

//         return res.status(500).json({
//             success: false,
//             message: "Internal server error"
//         });
//     }
// });

// if (require.main === module) {
//     const port = process.env.PORT || 3000;
//     app.listen(port, () => {
//         console.log(`Server running on port ${port}`);
//     });
// }

// module.exports = app;


// ========================================
// Send Brochure (simplified — no database needed)
// ========================================
// Upload PDFs to R2 manually, named exactly as: <programSlug>.pdf
// e.g. R2 bucket: brochures/digital-lending-credit.pdf

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Health Check Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Brochure Backend is running 🚀",
  });
});

// ========================================
// Send Brochure API
// ========================================
app.post("/api/send_brochure", async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      programSlug,
      sendBrochure = true,
      emailSubject,
      emailMessage,
    } = req.body;

    // Validation
    if (!name || !email || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    let pdfBase64;

    if (sendBrochure) {
      if (!programSlug) {
        return res.status(400).json({
          success: false,
          message: "programSlug is required when sending brochure.",
        });
      }

      const brochureUrl = `${
        process.env.R2_PUBLIC_URL.replace(/\/$/, "")
      }/brochures/${programSlug.trim()}.pdf`;

      console.log("Fetching brochure:", brochureUrl);

      const pdfResponse = await fetch(brochureUrl);

      if (!pdfResponse.ok) {
        return res.status(404).json({
          success: false,
          message: `Brochure not found for "${programSlug}"`,
        });
      }

      const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
      pdfBase64 = pdfBuffer.toString("base64");
    }

    // Send Email
    const { data, error } = await resend.emails.send({
      from: "Global FinTech Academy <no-reply@contact.cedisipartners.com>",
      to: [email],
      subject:
        emailSubject || "Your Global FinTech Academy Program Brochure",

      html: `
        <div style="font-family:Arial,sans-serif;padding:20px;max-width:600px">
          <h2>Hello ${name},</h2>

          <p>
            ${
              emailMessage ||
              "Thank you for your interest in our program. Please find your requested brochure attached."
            }
          </p>

          ${
            sendBrochure
              ? `<p>The brochure PDF is attached with this email.</p>`
              : `<p>Thank you for registering. Our team will contact you shortly.</p>`
          }

          <p>
            Visit us:
            <a href="https://globalfintechacademy.net">
              globalfintechacademy.net
            </a>
          </p>

          <p>
            Regards,<br/>
            <strong>Global FinTech Academy</strong>
          </p>
        </div>
      `,

      ...(pdfBase64
        ? {
            attachments: [
              {
                filename: `${programSlug}.pdf`,
                content: pdfBase64,
              },
            ],
          }
        : {}),
    });

    if (error) {
      console.error("Resend Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to send email.",
        error,
      });
    }

    return res.status(200).json({
      success: true,
      message: sendBrochure
        ? "Brochure sent successfully."
        : "Registration email sent successfully.",
      data,
    });
  } catch (err) {
    console.error("Internal Server Error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

// Local Development
const PORT = process.env.PORT || 3000;

if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel
export default app;