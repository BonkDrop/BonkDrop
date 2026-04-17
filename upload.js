const API_URL = "https://api.bonkdrop.fr/api/upload";

async function uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(API_URL, {
        method: "POST",
        body: formData,
    });

    return await res.json();
}

async function send() {
    const input = document.getElementById("fileInput");
    const file = input?.files?.[0];

    if (!file) {
        alert("Choisis un fichier");
        return;
    }

    const result = await uploadFile(file);
    console.log(result);

    if (result.success) {
        const link = document.getElementById("result");
        const safeId = encodeURIComponent(result.id || "");
        const fallbackUrl = `https://api.bonkdrop.fr/file/${safeId}`;

        link.innerHTML = `
            <p>Upload reussi</p>
            <a href="${fallbackUrl}" target="_blank" rel="noopener noreferrer">${fallbackUrl}</a>
        `;
    } else {
        alert("Erreur upload");
    }
}

window.send = send;

document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("fileInput");
    const selectedFileText = document.getElementById("selected-file");
    const dropZone = document.getElementById("drop-zone");

    if (fileInput && selectedFileText) {
        fileInput.addEventListener("change", () => {
            const file = fileInput.files?.[0];
            selectedFileText.textContent = file
                ? `${file.name} (${Math.ceil(file.size / 1024)} KB)`
                : "Aucun fichier selectionne";
        });
    }

    if (dropZone && fileInput) {
        dropZone.addEventListener("dragover", (event) => {
            event.preventDefault();
            dropZone.classList.add("hover");
        });

        dropZone.addEventListener("dragleave", () => {
            dropZone.classList.remove("hover");
        });

        dropZone.addEventListener("drop", (event) => {
            event.preventDefault();
            dropZone.classList.remove("hover");
            const droppedFiles = event.dataTransfer?.files;
            if (!droppedFiles || droppedFiles.length === 0) {
                return;
            }

            fileInput.files = droppedFiles;
            const file = droppedFiles[0];
            if (selectedFileText) {
                selectedFileText.textContent = `${file.name} (${Math.ceil(file.size / 1024)} KB)`;
            }
        });
    }
});