const API_URLS = ["/api/upload", "https://api.bonkdrop.fr/upload"];
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

function setStatus(message, type = "info") {
    const result = document.getElementById("result");

    if (!result) {
        return;
    }

    result.innerHTML = `<div class="status status-${type}">${message}</div>`;
}

function parseResponseBody(responseText, status, endpoint) {
    try {
        return JSON.parse(responseText);
    } catch (_error) {
        return {
            success: false,
            error: responseText || `HTTP_${status} on ${endpoint}`,
        };
    }
}

async function postFileToEndpoint(endpoint, file) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
    });

    const responseText = await res.text();
    const parsed = parseResponseBody(responseText, res.status, endpoint);

    return {
        status: res.status,
        endpoint,
        body: parsed,
    };
}

async function uploadFiles(files) {
    const formData = new FormData();

    for (const file of files) {
        formData.append("files", file);
    }

    const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
    });

    return await res.json();
}

async function send() {
    const input = document.getElementById("fileInput");
    const uploadBtn = document.getElementById("uploadBtn");
    const files = input?.files || [];

    if (!files || files.length === 0) {
        setStatus("Choisis un ou plusieurs fichiers", "error");
        return;
    }

    try {
        if (uploadBtn) {
            uploadBtn.disabled = true;
            uploadBtn.textContent = "Upload en cours...";
        }

        setStatus("Upload en cours...", "info");

        const result = await uploadFiles(files);
        console.log(result);

        if (result.success) {
            const links = result.files.map(f =>
                `<a href="${f.url}" target="_blank">${f.url}</a>`
            ).join("<br>");

            setStatus(`
                <p>Upload réussi :</p>
                ${links}
            `, "success");
        } else {
            throw new Error(result.error || "UPLOAD_FAILED");
        }
    } catch (e) {
        setStatus("Erreur upload: " + e.message, "error");
    } finally {
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.textContent = "Uploader et obtenir le lien";
        }
    }
}

window.send = send;

document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("fileInput");
    const selectedFileText = document.getElementById("selected-file");
    const dropZone = document.getElementById("drop-zone");
    const uploadBtn = document.getElementById("uploadBtn");

    if (fileInput && selectedFileText) {
        const handleFileChange = () => {
            const file = fileInput.files?.[0];
            setSelectedFile(file, fileInput, selectedFileText);
        };

        fileInput.addEventListener("change", handleFileChange);
        fileInput.addEventListener("input", handleFileChange);
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

    if (uploadBtn) {
        uploadBtn.addEventListener("click", () => {
            send();
        });
    }
});