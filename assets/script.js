const fileInput = document.getElementById("upfile");
const fileInfo = document.getElementById("file-info");
const form = document.getElementById("uploadForm");

// Display message when file is selected or not
fileInput.addEventListener("change", function () {
  const fileName = fileInput.files[0] ? fileInput.files[0].name : "";

  if (fileName) {
    fileInfo.style.display = "block"; // Show the message
    fileInfo.textContent = `File Selected: ${fileName}`; // Display file name
  } else {
    fileInfo.style.display = "block"; // Show the message
    fileInfo.textContent = `Choose a file in order to proceed`; // Display the "choose file" message
  }
});

// Display message if form is submitted without a file, but don't prevent submission
form.addEventListener("submit", function (event) {
  if (!fileInput.files.length) {
    fileInfo.style.display = "block";
    fileInfo.textContent = "Please choose a file to proceed"; // Display error message
    // event.preventDefault(); // Remove this line to allow form submission
  }
});
