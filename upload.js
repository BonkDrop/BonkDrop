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

async function uploadFile(file) {
    let lastAttempt = null;

    for (const endpoint of API_URLS) {
        const attempt = await postFileToEndpoint(endpoint, file);
        lastAttempt = attempt;

        if (attempt.body?.success) {
            return attempt.body;
        }

        // Si la route n'existe pas ici, on tente l'endpoint suivant.
        if (attempt.status === 404 || attempt.status === 405) {
            continue;
        }

        return attempt.body;
    }

    return {
        success: false,
        error: `HTTP_${lastAttempt?.status || "UNKNOWN"} on ${lastAttempt?.endpoint || "unknown endpoint"}`,
    };
}

async function send() {
    const input = document.getElementById("fileInput");
    const uploadBtn = document.getElementById("uploadBtn");
    const file = selectedFile || input?.files?.[0];

    if (!file) {
        setStatus("Choisis un fichier avant d'uploader.", "error");
        return;
    }

    try {
        if (uploadBtn) {
            uploadBtn.disabled = true;
            uploadBtn.textContent = "Upload en cours...";
        }

        setStatus("Upload en cours, veuillez patienter...", "info");

        const result = await uploadFile(file);
        console.log(result);

        if (result.success) {
            const fallbackUrl = result.url || `https://api.bonkdrop.fr/file/${encodeURIComponent(result.id || "")}`;

            setStatus(`
                <p>Upload réussi</p>
                <a href="${fallbackUrl}" target="_blank" rel="noopener noreferrer">${fallbackUrl}</a>
            `, "success");
            return;
        }

        throw new Error(result.error || "UPLOAD_FAILED");
    } catch (error) {
        console.error("Upload error:", error);
        setStatus(`Erreur upload: ${error?.message || "inconnue"}`, "error");
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