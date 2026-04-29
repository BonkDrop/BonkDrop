const API_URLS = ["/api/upload", "https://api.bonkdrop.fr/upload"];
const MAX_TOTAL_SIZE = 2 * 1024 * 1024 * 1024;
const MAX_FILES_COUNT = 1000;
let selectedFile = null;
let selectedFiles = [];

function formatFileSize(bytes) {
    if (bytes < 1024 * 1024) {
        return Math.ceil(bytes / 1024) + " KB";
    } else if (bytes < 1024 * 1024 * 1024) {
        return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    } else {
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
    }
}

function addFilesToSelection(newFiles) {
    const fileListElement = document.getElementById("files-list");
    
    if (!fileListElement) return;

    for (const file of newFiles) {
        selectedFiles.push(file);
    }

    if (selectedFiles.length > MAX_FILES_COUNT) {
        selectedFiles = selectedFiles.slice(0, MAX_FILES_COUNT);
    }

    updateFilesList();
}

function removeFileFromSelection(index) {
    selectedFiles.splice(index, 1);
    updateFilesList();
}

function updateFilesList() {
    const fileListElement = document.getElementById("files-list");
    const selectedFileText = document.getElementById("selected-file");
    const fileInput = document.getElementById("fileInput");
    
    if (!fileListElement || !selectedFileText) return;

    let totalSize = 0;
    for (const file of selectedFiles) {
        totalSize += file.size;
    }

    if (selectedFiles.length === 0) {
        fileListElement.innerHTML = "";
        selectedFileText.textContent = "Aucun fichier sélectionné";
        selectedFileText.style.color = "";
        if (fileInput) {
            fileInput.value = "";
        }
        return;
    }

    if (selectedFiles.length > MAX_FILES_COUNT) {
        selectedFileText.textContent = `Erreur: Trop de fichiers (${selectedFiles.length} > ${MAX_FILES_COUNT})`;
        selectedFileText.style.color = "#f2c0c9";
        return;
    }

    if (totalSize > MAX_TOTAL_SIZE) {
        selectedFileText.textContent = `Erreur: Taille totale dépasse 2 GB (${formatFileSize(totalSize)})`;
        selectedFileText.style.color = "#f2c0c9";
        return;
    }

    selectedFileText.style.color = "";
    if (selectedFiles.length === 1) {
        selectedFileText.textContent = `${selectedFiles[0].name} (${formatFileSize(selectedFiles[0].size)})`;
    } else {
        selectedFileText.textContent = `${selectedFiles.length} fichiers | Total: ${formatFileSize(totalSize)}`;
    }

    const listHTML = selectedFiles.map((file, index) => `
        <div class="file-item">
            <span class="file-name">${file.name}</span>
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 4px;">
                <span class="file-size">${formatFileSize(file.size)}</span>
                <button class="file-remove-btn" onclick="removeFileFromSelection(${index})" type="button" aria-label="Supprimer ${file.name}">×</button>
            </div>
        </div>
    `).join("");

    fileListElement.innerHTML = listHTML;

    if (fileInput) {
        try {
            const dataTransfer = new DataTransfer();
            for (const file of selectedFiles) {
                dataTransfer.items.add(file);
            }
            fileInput.files = dataTransfer.files;
        } catch (_error) {
        }
    }
}

function setStatus(message, type = "info") {
    const result = document.getElementById("result");

    if (!result) {
        return;
    }

    result.innerHTML = `<div class="status ${type}">${message}</div>`;
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

    const responseText = await res.text();
    const parsed = parseResponseBody(responseText, res.status, "/api/upload");
    
    if (!res.ok && !parsed.error) {
        parsed.error = `HTTP_${res.status}`;
        parsed.success = false;
    }
    
    return parsed;
}

async function send() {
    if (selectedFiles.length === 0) {
        setStatus("Choisissez un ou plusieurs fichiers", "error");
        return;
    }

    let totalSize = 0;
    for (const file of selectedFiles) {
        totalSize += file.size;
    }

    if (selectedFiles.length > MAX_FILES_COUNT || totalSize > MAX_TOTAL_SIZE) {
        setStatus("Erreur: La sélection de fichiers dépasse les limites", "error");
        return;
    }

    const uploadBtn = document.getElementById("uploadBtn");

    try {
        if (uploadBtn) {
            uploadBtn.disabled = true;
            uploadBtn.textContent = "Upload en cours...";
        }

        setStatus("Upload en cours...", "info");

        const result = await uploadFiles(selectedFiles);
        console.log(result);

        if (result.success) {
            const links = result.files.map(f =>
                `<a href="${f.url}" target="_blank">${f.url}</a>`
            ).join("<br>");

            setStatus(`
                <p>Upload réussi :</p>
                ${links}
            `, "success");

            selectedFiles = [];
            updateFilesList();
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
    const dropZone = document.getElementById("drop-zone");
    const uploadBtn = document.getElementById("uploadBtn");

    if (fileInput) {
        const handleFileChange = () => {
            const files = fileInput.files;
            if (files && files.length > 0) {
                addFilesToSelection(Array.from(files));
            }
            fileInput.value = "";
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

            addFilesToSelection(Array.from(droppedFiles));
        });
    }

    if (uploadBtn) {
        uploadBtn.addEventListener("click", () => {
            send();
        });
    }
});