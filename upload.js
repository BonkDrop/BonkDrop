const SUPABASE_CONFIG = {
    url: "https://nyvwcggocbplisszqaju.supabase.co",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55dndjZ2dvY2JwbGlzc3pxYWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNDAwMzMsImV4cCI6MjA4ODcxNjAzM30.Ly8uzFkvhFtyWm0Fwa4gM1B-W4MJwiodOM464xLj7Os"
};

const STORAGE_BUCKET = "bonkdrop";

const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const uploadBtn = document.getElementById("uploadBtn");
const result = document.getElementById("result");
const selectedFileText = document.getElementById("selected-file");

const { createClient } = window.supabase;
const supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);

let selectedFile = null;

function generateID() {
    return Math.random().toString(36).slice(2, 10);
}

function sanitizeFileName(name) {
    return name.toLowerCase().replace(/[^a-z0-9._-]/g, "-");
}

function renderStatus(type, message) {
    result.innerHTML = `<div class="status ${type}">${message}</div>`;
}

function renderResult(url) {
    result.innerHTML = `
        <div class="result-card">
            <p class="result-title">Lien pret a partager</p>
            <div class="result-link-row">
                <input class="result-link" type="text" value="${url}" readonly>
                <button class="btn-copy" type="button" id="copyLinkBtn">Copier</button>
            </div>
        </div>
    `;

    const copyBtn = document.getElementById("copyLinkBtn");
    copyBtn.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(url);
            renderStatus("success", "Lien copie dans le presse-papiers.");
        } catch {
            renderStatus("error", "Impossible de copier automatiquement. Copiez le lien manuellement.");
        }
    });
}

function setSelectedFile(file) {
    selectedFile = file;
    selectedFileText.textContent = file
        ? `${file.name} (${Math.ceil(file.size / 1024)} KB)`
        : "Aucun fichier selectionne";
}

async function uploadSelectedFile() {
    if (!selectedFile) {
        renderStatus("error", "Selectionnez d'abord un fichier.");
        return;
    }

    uploadBtn.disabled = true;
    uploadBtn.textContent = "Upload en cours...";
    renderStatus("info", "Upload en cours, veuillez patienter...");

    const filePath = `${Date.now()}-${generateID()}-${sanitizeFileName(selectedFile.name)}`;

    try {
        const { error: uploadError } = await supabaseClient.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, selectedFile, {
                upsert: false,
                contentType: selectedFile.type || "application/octet-stream"
            });

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabaseClient.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filePath);

        if (!data?.publicUrl) {
            throw new Error("Impossible de generer le lien public.");
        }

        renderResult(data.publicUrl);
    } catch (error) {
        const details = error?.message ? ` (${error.message})` : "";
        renderStatus("error", `Echec de l'upload${details}`);
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = "Uploader et obtenir le lien";
    }
}

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

    if (event.dataTransfer.files?.length > 0) {
        setSelectedFile(event.dataTransfer.files[0]);
    }
});

fileInput.addEventListener("change", () => {
    setSelectedFile(fileInput.files?.[0] || null);
});

uploadBtn.addEventListener("click", uploadSelectedFile);