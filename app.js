const express = require("express");
const upload = require("express-fileupload");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const pdfLib = require("pdf-lib");
const mammoth = require("mammoth"); // Import mammoth for DOCX parsing

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

// Function to calculate word and character counts from DOCX
function getWordAndCharCounts(docxPath) {
  return new Promise((resolve, reject) => {
    mammoth
      .extractRawText({ path: docxPath })
      .then((result) => {
        const text = result.value; // Extracted text from DOCX
        const wordCount = text.split(/\s+/).length; // Split by whitespace to count words
        const charCount = text.length; // Character count (including spaces)
        resolve({ wordCount, charCount });
      })
      .catch((err) => {
        reject(err);
      });
  });
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
                    <h1 style="color: red;">Error: Invalid File Type</h1>
                    <p>Please choose a DOCX file to proceed.</p>
                    <button onclick="window.history.back()" style="font-size: 16px; padding: 10px; background-color: #007BFF; color: white; text-decoration: none; border-radius: 5px; cursor: pointer; transition: background-color 0.3s ease;">Go Back
                    </button>
                </div>
            </div>
        </body>
        </html>
      `);
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

    // Path where the converted PDF will be placed
    const uploadPdfPath = path.join(uploadsDir, `${fileBaseName}${extend_pdf}`);

    // Use LibreOffice to convert DOCX to PDF (headless mode)
    exec(
      `libreoffice --headless --convert-to pdf --outdir ${uploadsDir} ${uploadPath}`,
      (err, stdout, stderr) => {
        if (err) {
          console.error("LibreOffice conversion error:", stderr);
          return res.status(500).send("Error during PDF conversion");
        }

        // File conversion succeeded, get word and character counts
        getWordAndCharCounts(uploadPath)
          .then(({ wordCount, charCount }) => {
            // Get the page count from the generated PDF
            getPdfPageCount(uploadPdfPath)
              .then((pdfPageCount) => {
                const redirectUrl = `/down_html?wordCount=${wordCount}&characterCount=${charCount}&pdfPageCount=${pdfPageCount}`;
                res.redirect(redirectUrl);
              })
              .catch((err) => {
                console.error("Error extracting PDF page count:", err);
                res.status(500).send("Error extracting metadata");
              });
          })
          .catch((err) => {
            console.error("Error extracting word and character count:", err);
            res.status(500).send("Error extracting word and character count");
          });
      }
    );
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
