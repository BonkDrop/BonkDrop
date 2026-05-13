const API_URLS = ["/api/upload", "https://api.bonkdrop.fr/api/upload"];
const UPLOAD_TIMEOUT_MS = 45000;
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

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

// Parcours récursif des DataTransferItem pour récupérer les fichiers dans les dossiers déposés
function readAllEntries(reader) {
    return new Promise((resolve, reject) => {
        reader.readEntries(function (results) {
            resolve(results);
        }, reject);
    });
}

async function traverseFileEntry(entry, path = "") {
    if (entry.isFile) {
        return new Promise((resolve) => {
            entry.file((file) => {
                // Attacher un chemin relatif utile si nécessaire
                try { file.relativePath = path + file.name; } catch (_e) {}
                resolve([file]);
            }, () => resolve([]));
        });
    }

    if (entry.isDirectory) {
        const files = [];
        const reader = entry.createReader();
        let entries = await readAllEntries(reader);
        // readEntries peut renvoyer par morceaux; continuer jusqu'à vide
        while (entries.length > 0) {
            for (const e of entries) {
                const nested = await traverseFileEntry(e, path + entry.name + "/");
                for (const f of nested) files.push(f);
            }
            entries = await readAllEntries(reader);
        }
        return files;
    }

    return [];
}

async function getFilesFromDataTransferItems(items) {
    const files = [];
    const entryPromises = [];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (typeof item.webkitGetAsEntry === "function") {
            const entry = item.webkitGetAsEntry();
            if (entry) entryPromises.push(traverseFileEntry(entry, ""));
        } else if (item.kind === "file") {
            const f = item.getAsFile();
            if (f) files.push(f);
        }
    }

    if (entryPromises.length > 0) {
        const results = await Promise.all(entryPromises);
        for (const arr of results) {
            for (const f of arr) files.push(f);
        }
    }

    return files;
}

async function getFilesFromDirectoryHandle(directoryHandle, currentPath = "") {
    const files = [];

    for await (const [name, handle] of directoryHandle.entries()) {
        if (handle.kind === "file") {
            const file = await handle.getFile();
            try { file.relativePath = currentPath + name; } catch (_e) {}
            files.push(file);
            continue;
        }

        if (handle.kind === "directory") {
            const nestedFiles = await getFilesFromDirectoryHandle(handle, currentPath + name + "/");
            for (const nestedFile of nestedFiles) {
                files.push(nestedFile);
            }
        }
    }

    return files;
}

async function postFileToEndpoint(endpoint, files) {
    const formData = new FormData();
    for (const file of files) {
        formData.append("files", file);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

    let res;
    try {
        res = await fetch(endpoint, {
            method: "POST",
            body: formData,
            signal: controller.signal,
        });
    } catch (error) {
        clearTimeout(timeoutId);
        if (error && error.name === "AbortError") {
            return {
                status: 0,
                endpoint,
                body: { success: false, error: "UPLOAD_TIMEOUT" },
            };
        }

        return {
            status: 0,
            endpoint,
            body: { success: false, error: "NETWORK_ERROR" },
        };
    }

    clearTimeout(timeoutId);

    const responseText = await res.text();
    const parsed = parseResponseBody(responseText, res.status, endpoint);

    if (res.status === 413) {
        parsed.error = "HTTP_413";
        parsed.success = false;
    }

    if (!res.ok && !parsed.error) {
        parsed.error = `HTTP_${res.status}`;
        parsed.success = false;
    }

    return {
        status: res.status,
        endpoint,
        body: parsed,
    };
}

async function uploadFiles(files) {
    let lastAttempt = null;

    for (let index = 0; index < API_URLS.length; index++) {
        const endpoint = API_URLS[index];
        const attempt = await postFileToEndpoint(endpoint, files);
        const error = attempt.body?.error;
        const isLastEndpoint = index === API_URLS.length - 1;

        if (attempt.body?.success) {
            return attempt.body;
        }

        lastAttempt = attempt;

        const shouldFallback = !isLastEndpoint && (
            attempt.status === 0 ||
            attempt.status === 413 ||
            attempt.status === 404 ||
            attempt.status === 405 ||
            attempt.status === 401 ||
            attempt.status === 403 ||
            error === "UPLOAD_TIMEOUT" ||
            error === "NETWORK_ERROR"
        );

        if (!shouldFallback) {
            return attempt.body;
        }
    }

    if (lastAttempt && lastAttempt.body) {
        return lastAttempt.body;
    }

    return { success: false, error: "UPLOAD_FAILED" };
}

function renderSuccessResult(files) {
    const result = document.getElementById("result");

    if (!result) {
        return;
    }

    const cards = files.map((file) => {
        const safeUrl = escapeHtml(file.url);
        return `
            <div class="result-link-row">
                <a class="result-link" href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>
                <button class="btn-copy" type="button" data-copy-url="${safeUrl}">Copier</button>
            </div>
        `;
    }).join("");

    result.innerHTML = `
        <div class="result-card">
            <div class="result-title">Upload réussi</div>
            ${cards}
        </div>
    `;
}

async function copyResultLink(url, button) {
    try {
        await navigator.clipboard.writeText(url);
        const previousText = button.textContent;
        button.textContent = "Copié";
        setTimeout(() => {
            button.textContent = previousText;
        }, 1500);
    } catch (_error) {
        window.open(url, "_blank", "noopener,noreferrer");
    }
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
            renderSuccessResult(result.files);

            selectedFiles = [];
            updateFilesList();
        } else {
            throw new Error(result.error || `HTTP_${result.status || 0}`);
        }
    } catch (e) {
        let message = e.message || "UPLOAD_FAILED";

        if (message === "UPLOAD_TIMEOUT") {
            message = "Le serveur met trop de temps a repondre. Reessayez dans quelques instants.";
        } else if (message === "HTTP_413") {
            message = "Le fichier est trop volumineux pour le serveur actuel (limite nginx/proxy).";
        } else if (message === "MISSING_SERVER_API_KEY") {
            message = "Config serveur invalide : manque clé api upload";
        } else if (message === "UNAUTHORIZED" || message === "HTTP_401") {
            message = "Unauthorized: cle API invalide ou manquante sur le serveur d'upload.";
        }

        setStatus("Erreur upload: " + message, "error");
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
    const folderInput = document.getElementById("folderInput");
    const folderTrigger = document.getElementById("folder-trigger");
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

    if (folderInput) {
        const handleFolderChange = () => {
            const files = folderInput.files;
            if (files && files.length > 0) {
                addFilesToSelection(Array.from(files));
            }
            folderInput.value = "";
        };

        folderInput.addEventListener("change", handleFolderChange);
        folderInput.addEventListener("input", handleFolderChange);
    }

    if (folderTrigger && folderInput) {
        folderTrigger.addEventListener("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();

            // Prefer native directory picker when available for explicit folder-only selection.
            if (typeof window.showDirectoryPicker === "function") {
                try {
                    const selectedDir = await window.showDirectoryPicker();
                    const pickedFiles = await getFilesFromDirectoryHandle(selectedDir);

                    if (pickedFiles.length > 0) {
                        addFilesToSelection(pickedFiles);
                    }
                    return;
                } catch (error) {
                    // User cancellation should not show an error.
                    if (error && error.name === "AbortError") {
                        return;
                    }
                }
            }

            // Fallback for browsers without File System Access API.
            folderInput.click();
        });
    }

    if (dropZone && fileInput) {
        dropZone.addEventListener("click", (event) => {
            const target = event.target;
            if (target instanceof Element) {
                if (target.closest(".file-remove-btn") || target.closest("#folder-trigger")) {
                    return;
                }
            }
            fileInput.click();
        });

        dropZone.addEventListener("dragover", (event) => {
            event.preventDefault();
            dropZone.classList.add("hover");
        });

        dropZone.addEventListener("dragleave", () => {
            dropZone.classList.remove("hover");
        });

        dropZone.addEventListener("drop", async (event) => {
            event.preventDefault();
            dropZone.classList.remove("hover");

            // Si le navigateur expose les items (permets dossiers), on les parcourt
            const items = event.dataTransfer?.items;
            if (items && items.length > 0) {
                try {
                    const filesFromItems = await getFilesFromDataTransferItems(items);
                    if (filesFromItems && filesFromItems.length > 0) {
                        addFilesToSelection(filesFromItems);
                        return;
                    }
                } catch (_err) {
                }
            }

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

    const result = document.getElementById("result");
    if (result) {
        result.addEventListener("click", (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) {
                return;
            }

            const copyButton = target.closest(".btn-copy");
            if (!(copyButton instanceof HTMLButtonElement)) {
                return;
            }

            const url = copyButton.dataset.copyUrl;
            if (!url) {
                return;
            }

            copyResultLink(url, copyButton);
        });
    }
});