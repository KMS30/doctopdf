const express = require("express");
const upload = require("express-fileupload");
const mammoth = require("mammoth");
const path = require("path");
const fs = require("fs");
const Docxtemplater = require("docxtemplater");
const PizZip = require("pizzip");
const puppeteer = require("puppeteer");
const pdfLib = require("pdf-lib");

const app = express();

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const extend_pdf = ".pdf";
const extend_docx = ".docx";
let down_name;

// Use express-fileupload middleware
app.use(upload());

// Serve static files (CSS and JS) from the "assets" folder
app.use(express.static(path.join(__dirname, "assets")));

// Serve the main HTML page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Function to get the page count of a PDF (using pdf-lib)
async function getPdfPageCount(pdfPath) {
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await pdfLib.PDFDocument.load(pdfBytes);
  return pdfDoc.getPages().length;
}

// Handle file upload and processing
app.post("/upload", (req, res) => {
  if (!req.files || !req.files.upfile) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>No File Selected</title>
          <link href="/styles.css" rel="stylesheet" />
      </head>
      <body>
          <div class="container">
              <div class="card">
                  <h1 style="color: red;">Error: No File Selected</h1>
                  <p>Please choose a DOCX file to proceed.</p>
                  <button onclick="window.history.back()" style="font-size: 16px; padding: 10px; background-color: #007BFF; color: white; text-decoration: none; border-radius: 5px; cursor: pointer; transition: background-color 0.3s ease;">Go Back
                  </button>
              </div>
          </div>
      </body>
      </html>
    `);
  }

  const file = req.files.upfile;
  if (!file.name.endsWith(".docx")) {
    return res.send(`...`);
  }

  const name = file.name;
  const uploadPath = path.join(uploadsDir, name);
  const fileBaseName = name.split(".")[0];
  down_name = fileBaseName;

  // Move the uploaded file to the uploads directory
  file.mv(uploadPath, (err) => {
    if (err) {
      console.error("File upload failed:", err);
      return res.status(500).send("File upload failed");
    }

    // Read the file to extract metadata using docxtemplater
    const docxFile = fs.readFileSync(uploadPath);
    const zip = new PizZip(docxFile);
    const doc = new Docxtemplater(zip);

    // Extract text from docx file using mammoth for conversion to HTML
    mammoth
      .convertToHtml({ buffer: docxFile, styleMap: ["p => p"] }) // We can add specific style maps to control formatting
      .then((mammothResult) => {
        console.log("Mammoth result:", mammothResult);

        const text = mammothResult.value;
        const wordCount = text.split(/\s+/).length;
        const characterCount = text.replace(/\s+/g, "").length;
        const pageCount = "Not available";

        // Path where the converted PDF will be placed
        const uploadPdfPath = path.join(
          uploadsDir,
          `${fileBaseName}${extend_pdf}`
        );

        // Use Puppeteer to generate PDF from HTML (instead of PhantomJS)
        puppeteer
          .launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] })
          .then(async (browser) => {
            const page = await browser.newPage();

            // Improved HTML template to embed images and preserve layout
            const contentHtml = `
              <html>
                <head>
                  <style>
                    body {
                      font-family: Arial, sans-serif;
                      font-size: 12pt;
                      line-height: 1.5;
                      margin: 20px;
                    }
                    p {
                      margin: 15px 0;
                    }
                    h1, h2, h3 {
                      margin: 20px 0;
                      page-break-before: always;
                    }
                    img {
                      max-width: 100%;
                      height: auto;
                    }
                    .footer {
                      position: fixed;
                      bottom: 0;
                      left: 0;
                      width: 100%;
                      text-align: center;
                      font-size: 10pt;
                    }
                    .page-break {
                      page-break-before: always;
                    }
                  </style>
                </head>
                <body>
                  <div class="content">${text}</div>
                  <div class="footer">Generated PDF</div>
                </body>
              </html>
            `;

            await page.setContent(contentHtml, {
              waitUntil: "domcontentloaded",
              timeout: 60000,
            });

            // Generate the PDF with correct layout
            await page.pdf({
              path: uploadPdfPath,
              format: "A4",
              printBackground: true,
              margin: {
                top: "20mm",
                right: "20mm",
                bottom: "20mm",
                left: "20mm",
              },
              preferCSSPageSize: true,
            });

            await browser.close();

            // Get the page count from the generated PDF
            try {
              const pdfPageCount = await getPdfPageCount(uploadPdfPath);

              // Redirect to the /down_html route with metadata in the query string
              const redirectUrl = `/down_html?wordCount=${wordCount}&characterCount=${characterCount}&pdfPageCount=${pdfPageCount}`;
              res.redirect(redirectUrl);
            } catch (err) {
              console.error("Error extracting page count from PDF:", err);
              res.status(500).send("Error extracting page count");
            }
          })
          .catch((err) => {
            console.error("Puppeteer error:", err);
            res.status(500).send("PDF generation failed");
          });
      })
      .catch((err) => {
        console.error("Metadata extraction error:", err);
        res.status(500).send("Error extracting metadata");
      });
  });
});

// Handle file download
app.get("/download", (req, res) => {
  const pdfPath = path.join(uploadsDir, `${down_name}${extend_pdf}`);

  res.download(pdfPath, `${down_name}${extend_pdf}`, (err) => {
    if (err) {
      console.error("Error during file download:", err);
      return res.status(500).send("Error during file download");
    }

    // Clean up uploaded and converted files after download
    try {
      fs.unlinkSync(path.join(uploadsDir, `${down_name}${extend_docx}`));
      fs.unlinkSync(pdfPath);
      console.log("Files cleaned up successfully");
    } catch (err) {
      console.error("File cleanup error:", err);
    }
  });
});

// Serve the down_html page for displaying conversion metadata
app.get("/down_html", (req, res) => {
  const { wordCount, characterCount, pdfPageCount } = req.query;

  if (!wordCount || !characterCount || !pdfPageCount) {
    return res.status(400).send("Missing metadata parameters.");
  }

  fs.readFile(path.join(__dirname, "down_html.html"), "utf-8", (err, html) => {
    if (err) {
      console.error("Error reading down_html.html:", err);
      return res.status(500).send("Error loading the thank you page");
    }

    html = html
      .replace("WORD_COUNT_PLACEHOLDER", wordCount)
      .replace("CHAR_COUNT_PLACEHOLDER", characterCount)
      .replace("PAGE_COUNT_PLACEHOLDER", pdfPageCount);

    res.send(html);
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
