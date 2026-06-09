const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const token = params.get("token");
const status = document.getElementById("status");
const btn = document.getElementById("downloadBtn");

if (id) {
    const safeId = encodeURIComponent(id);
    const fileUrl =
        `https://api.bonkdrop.fr/${encodeURIComponent(id)}/${encodeURIComponent(token)}`;
    status.textContent = "Fichier en attente de récupération";
    btn.href = fileUrl;
    btn.setAttribute("download", "");
    btn.target = "_blank";
    btn.hidden = false;
} else {
    window.location.replace("notfound.html");
}

if (!id || !token) {
    window.location.replace("notfound.html");
}