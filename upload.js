const API_URL = "https://api.bonkdrop.fr/api/upload";
let selectedFile = null;

function setSelectedFile(file, fileInput, selectedFileText) {
    selectedFile = file || null;

    if (fileInput && selectedFile) {
        try {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(selectedFile);
            fileInput.files = dataTransfer.files;
        } catch (_error) {
            // Certains navigateurs limitent l'écriture directe de input.files.
        }
    }

    if (selectedFileText) {
        selectedFileText.textContent = selectedFile
            ? `${selectedFile.name} (${Math.ceil(selectedFile.size / 1024)} KB)`
            : "Aucun fichier sélectionné";
    }
}

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
    const file = selectedFile || input?.files?.[0];

    if (!file) {
        alert("Choisis un fichier");
        return;
    }

    const link = document.getElementById("result");

    try {
        const result = await uploadFile(file);
        console.log(result);

        if (result.success) {
            const safeId = encodeURIComponent(result.id || "");
            const fallbackUrl = `https://api.bonkdrop.fr/file/${safeId}`;

            link.innerHTML = `
                <p>Upload réussi</p>
                <a href="${fallbackUrl}" target="_blank" rel="noopener noreferrer">${fallbackUrl}</a>
            `;
            return;
        }

        throw new Error(result.error || "UPLOAD_FAILED");
    } catch (error) {
        console.error("Upload error:", error);
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
            setSelectedFile(file, fileInput, selectedFileText);
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

            setSelectedFile(droppedFiles[0], fileInput, selectedFileText);
        });
    }
});