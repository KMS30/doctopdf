# **DocToPDF**

A lightweight and offline-capable web application that processes Word documents (.docx) and converts them to PDF. This project also provides features like file metadata extraction, PDF password protection (optional), and easy deployment through Docker and Kubernetes.

---

## **Features**

1. **Upload and Convert**: Upload a `.docx` file, convert it to PDF, and download the result.
2. **Metadata Extraction**: Displays the following metadata:
   - Word Count
   - Character Count
   - PDF Page Count
3. **User-Friendly UI**: A simple HTML-based user interface for seamless interactions.
4. **Offline Functionality**: Entire application runs locally.
5. **Dockerized**: Easily containerized using Docker.
6. **Kubernetes-Ready**: Includes manifests for deployment on Kubernetes clusters.
7. **Optional Enhancements**:
   - Hosted endpoints for public testing.
   - PDF password protection support.
   - Microservice architecture for scalability.

---

## **Tech Stack**

- **Backend**: Node.js with Express
- **Frontend**: HTML, CSS, JavaScript
- **Conversion Tools**: LibreOffice, Puppeteer
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **Other Libraries**:
  - `express-fileupload`: File upload middleware.
  - `mammoth`: Extract text from DOCX files.
  - `pdf-lib`: Manipulate and extract metadata from PDFs.
  - `pdf-parse`: Parse PDF files.
  - `puppeteer`: Chromium automation.

---

## **Directory Structure**

```
doctopdf/
│
├── assets/
│   ├── styles.css        # Stylesheet for UI
│   ├── style.css         # Additional styles
│   └── script.js         # Frontend JavaScript for UI interactions
│
├── kubernetes/
│   ├── deployment.yml    # Kubernetes Deployment manifest
│   └── service.yml       # Kubernetes Service manifest
│
├── .github/workflows/
│   └── docker-build.yml  # GitHub Actions pipeline for Docker build
│
├── uploads/              # Temporary storage for uploaded and converted files
│
├── app.js                # Main application logic
├── Dockerfile            # Docker configuration file
├── index.html            # Frontend HTML page
├── package.json          # Project metadata and dependencies
├── run-container.sh      # Bash script to build and run Docker container
└── README.md             # Documentation (this file)
```

---

## **Dependencies**

The project uses the following dependencies (defined in `package.json`):

| Dependency           | Version | Description                                                              |
| -------------------- | ------- | ------------------------------------------------------------------------ |
| `express`            | ^4.21.1 | Web server framework for handling routes and middleware.                 |
| `express-fileupload` | ^1.5.1  | Middleware for handling file uploads.                                    |
| `mammoth`            | ^1.8.0  | Extracts raw text from DOCX files.                                       |
| `pdf-lib`            | ^1.17.1 | Library for working with PDF documents (metadata, manipulation, etc.).   |
| `pdf-parse`          | ^1.1.1  | Library for parsing PDFs and extracting information.                     |
| `puppeteer`          | ^23.9.0 | Chromium automation for rendering tasks (e.g., visual PDF manipulation). |

Install dependencies using:

```bash
npm install
```

---

## **Getting Started**

### **1. Clone the Repository**

```bash
git clone https://github.com/KMS30/doctopdf.git
cd doctopdf
```

### **2. Install Dependencies**

Ensure Node.js and npm are installed, then run:

```bash
npm install
```

### **3. Run the Application Locally**

```bash
node app.js
```

Access the application in your browser at `http://localhost:3000`.

---

## **Usage Workflow**

1. **Upload File**: Navigate to the homepage and upload a `.docx` file.
2. **Conversion**: The file is processed and converted to a PDF using LibreOffice in the backend.
3. **Metadata Display**: Extracted metadata (word count, character count, and page count) is shown on the results page.
4. **Download File**: Click the download button to retrieve the converted PDF.
5. **Cleanup**: Uploaded and converted files are automatically deleted post-download.

---

## **Docker Setup**

### **1. Build Docker Image**

```bash
docker build -t doctopdf .
```

### **2. Run Docker Container**

```bash
docker run -p 3000:3000 doctopdf
```

Access the app at `http://localhost:3000`.

### **3. Bash Script**

The project includes a bash script to automate container execution:

```bash
bash run-container.sh
```

---

## **Kubernetes Deployment**

### **1. Apply Manifests**

```bash
kubectl apply -f kubernetes/deployment.yml
kubectl apply -f kubernetes/service.yml
```

### **2. Access Application**

Use the Kubernetes service's external IP or port-forward to access the app.

---

## **CI/CD Pipeline**

A GitHub Actions pipeline is included (`docker-build.yml`) to automatically build and push the Docker image on every commit.

---

## **Future Enhancements**

1. Add hosted endpoints for testing.
2. Implement password protection for PDFs.
3. Extend to a microservice architecture for better scalability.

---

## **Contributing**

Contributions are welcome! Feel free to fork the repository, make changes, and submit a pull request.
