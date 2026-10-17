// // ========================================
// // Send Brochure (simplified — no database needed)
// // ========================================
// // Upload PDFs to R2 manually, named exactly as: <programSlug>.pdf
// // e.g. R2 bucket: brochures/digital-lending-credit.pdf

// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import { Resend } from "resend";

// dotenv.config();

// const app = express();
// const resend = new Resend(process.env.RESEND_API_KEY);

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Health Check Route
// app.get("/", (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: "Brochure Backend is running 🚀",
//   });
// });

// // ========================================
// // Send Brochure API
// // ========================================
// app.post("/api/send_brochure", async (req, res) => {
//   try {
//     const {
//       name,
//       email,
//       phoneNumber,
//       programSlug,
//       sendBrochure = true,
//       emailSubject,
//       emailMessage,
//     } = req.body;

//     // Validation
//     if (!name || !email || !phoneNumber) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields",
//       });
//     }

//     let pdfBase64;

//     if (sendBrochure) {
//       if (!programSlug) {
//         return res.status(400).json({
//           success: false,
//           message: "programSlug is required when sending brochure.",
//         });
//       }

//       const brochureUrl = `${process.env.R2_PUBLIC_URL.replace(/\/$/, "")}/gfa/brochures/${programSlug.trim()}.pdf`;

//       console.log("Fetching brochure:", brochureUrl);

//       const pdfResponse = await fetch(brochureUrl);

//       if (!pdfResponse.ok) {
//         return res.status(404).json({
//           success: false,
//           message: `Brochure not found for "${programSlug}"`,
//         });
//       }

//       const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
//       pdfBase64 = pdfBuffer.toString("base64");
//     }

//     // Send Email
//     const { data, error } = await resend.emails.send({
//       from: "Global FinTech Academy <no-reply@contact.cedisipartners.com>",
//       to: [email],
//       subject:
//         emailSubject || "Your Global FinTech Academy Program Brochure",

//       html: `
//         <div style="font-family:Arial,sans-serif;padding:20px;max-width:600px">
//           <h2>Hello ${name},</h2>

//           <p>
//             ${
//               emailMessage ||
//               "Thank you for your interest in our program. Please find your requested brochure attached."
//             }
//           </p>

//           ${
//             sendBrochure
//               ? `<p>The brochure PDF is attached with this email.</p>`
//               : `<p>Thank you for registering. Our team will contact you shortly.</p>`
//           }

//           <p>
//             Visit us:
//             <a href="https://globalfintechacademy.net">
//               globalfintechacademy.net
//             </a>
//           </p>

//           <p>
//             Regards,<br/>
//             <strong>Global FinTech Academy</strong>
//           </p>
//         </div>
//       `,

//       ...(pdfBase64
//         ? {
//             attachments: [
//               {
//                 filename: `${programSlug}.pdf`,
//                 content: pdfBase64,
//               },
//             ],
//           }
//         : {}),
//     });

//     if (error) {
//       console.error("Resend Error:", error);

//       return res.status(500).json({
//         success: false,
//         message: "Failed to send email.",
//         error,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: sendBrochure
//         ? "Brochure sent successfully."
//         : "Registration email sent successfully.",
//       data,
//     });
//   } catch (err) {
//     console.error("Internal Server Error:", err);

//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: err.message,
//     });
//   }
// });

// // Local Development
// const PORT = process.env.PORT || 3000;

// if (process.env.VERCEL !== "1") {
//   app.listen(PORT, () => {
//     console.log(`✅ Server running on http://localhost:${PORT}`);
//   });
// }

// // Export for Vercel
// export default app;





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
      programTitle,
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

      // Get programs from CMS
      const cmsResponse = await fetch(
        `${process.env.CMS_API_URL}/collections/program`
      );

      if (!cmsResponse.ok) {
        throw new Error("Failed to fetch programs from CMS");
      }

      const programs = await cmsResponse.json();

      // Find the requested program
      let program = programs.find((item) => {
        const data = item?.data || {};

        return (
          data.program_slug === programSlug.trim() ||
          data.slug === programSlug.trim()
        );
      });

      if (!program) {
        const legacyBrochureMap = {
          "executive-certificate-programme-in-fintech-for-microfinance":
            "executive-certificate-programme-in-fintech-for-microfinance.pdf",

          "ai-and-agentic-flow-implementation-in-microfinance":
            "ai-and-agentic-flow-implementation-in-microfinance.pdf",
        };

        const legacyFilename = legacyBrochureMap[programSlug.trim()];

        if (!legacyFilename) {
          return res.status(404).json({
            success: false,
            message: `Program not found for "${programSlug}"`,
          });
        }

        const legacyBrochureUrl =
          `${process.env.R2_PUBLIC_URL.replace(/\/$/, "")}/gfa/brochures/${legacyFilename}`;

        // Create a temporary program object so the existing
        // brochure-fetching code can continue to work.
        program = {
          data: {
            program_hero_brochour_pdf: legacyBrochureUrl,
          },
        };

        console.log("Using legacy brochure:", legacyBrochureUrl);
      }

      // Get brochure URL/reference from CMS
      const brochureUrl = program?.data?.program_hero_brochour_pdf;

      if (!brochureUrl) {
        return res.status(404).json({
          success: false,
          message: `Brochure not found for "${programSlug}"`,
        });
      }

      console.log("Fetching brochure:", brochureUrl);

      const pdfResponse = await fetch(brochureUrl);


      if (!pdfResponse.ok) {
        return res.status(404).json({
          success: false,
          message: `Brochure PDF could not be fetched for "${programSlug}"`,
        });
      }

      const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

      pdfBase64 = pdfBuffer.toString("base64");
    }

    const safeProgramTitle = (programTitle || programSlug || "program")
      .toString()
      .trim()
      .replace(/[\\/:*?"<>|]/g, "-") || "program";

    // Send Email
    const { data, error } = await resend.emails.send({
      from: "Global FinTech Academy <no-reply@contact.cedisipartners.com>",
      to: [email],
      subject:
        emailSubject || "Your Global FinTech Academy Document",

      html: `
        <div style="font-family:Arial,sans-serif;padding:20px;max-width:600px">
          <h2>Hello ${name},</h2>

          <p>
            ${emailMessage ||
        "Thank you for your interest in our program. Please find your requested document attached."
        }
          </p>

          ${sendBrochure
          ? `<p>The document PDF is attached with this email.</p>`
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
                filename: `${safeProgramTitle}.pdf`,
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
        ? "Document sent successfully."
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