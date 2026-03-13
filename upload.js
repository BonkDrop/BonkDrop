const SUPABASE_FUNCTION_URL = "https://nyvwcggocbplisszqaju.supabase.co/functions/v1/upload";

const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const uploadBtn = document.getElementById("uploadBtn");
const result = document.getElementById("result");
const selectedFileText = document.getElementById("selected-file");

let selectedFile = null;

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
            renderStatus("error", "Impossible de copier automatiquement.");
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

    try {

        const formData = new FormData();
        formData.append("file", selectedFile);

        const res = await fetch(SUPABASE_FUNCTION_URL, {
            method: "POST",
            body: formData
        });

        if (!res.ok) {
            throw new Error("Erreur serveur");
        }

        const data = await res.json();

        if (!data.url) {
            throw new Error("Lien non reçu");
        }

        renderResult(data.url);

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