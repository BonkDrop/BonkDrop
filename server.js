const express = require("express");

const app = express();
const port = process.env.PORT || 3000;

const INTERNAL_UPLOAD_URL = process.env.BONKDROP_INTERNAL_UPLOAD_URL || "https://api.bonkdrop.fr/upload";
const INTERNAL_API_KEY = process.env.BONKDROP_INTERNAL_API_KEY;

const ALLOWED_ORIGINS = new Set([
	"https://bonkdrop.fr",
	"https://www.bonkdrop.fr",
	"https://bonkdrop.github.io",
	"http://localhost:3000",
]);

function isLocalOrigin(origin) {
	try {
		const url = new URL(origin);
		return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
	} catch (_error) {
		return origin === "null";
	}
}

function setCorsHeaders(req, res) {
	const origin = req.headers.origin;
	if (origin && (ALLOWED_ORIGINS.has(origin) || isLocalOrigin(origin))) {
		res.setHeader("Access-Control-Allow-Origin", origin);
		res.setHeader("Vary", "Origin");
	}
	res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Requested-With");
}

app.options("/api/upload", (req, res) => {
	setCorsHeaders(req, res);
	res.status(204).end();
});

app.post("/api/upload", async (req, res) => {
	setCorsHeaders(req, res);

	try {
		const headers = {
			"content-type": req.headers["content-type"] || "application/octet-stream",
		};

		if (INTERNAL_API_KEY) {
			headers["x-api-key"] = INTERNAL_API_KEY;
		}

		const upstreamResponse = await fetch(INTERNAL_UPLOAD_URL, {
			method: "POST",
			headers,
			body: req,
			duplex: "half",
		});

		const contentType = upstreamResponse.headers.get("content-type") || "application/json";
		res.status(upstreamResponse.status);
		res.setHeader("Content-Type", contentType);

		const textBody = await upstreamResponse.text();
		res.send(textBody);
	} catch (error) {
		console.error("Upload proxy error:", error);
		res.status(502).json({ success: false, error: "UPLOAD_PROXY_ERROR" });
	}
});

app.get("/health", (_req, res) => {
	res.json({ ok: true });
});

app.listen(port, () => {
	console.log(`BonkDrop API proxy running on port ${port}`);
});
