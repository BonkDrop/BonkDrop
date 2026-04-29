const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

const INTERNAL_UPLOAD_URL = process.env.BONKDROP_INTERNAL_UPLOAD_URL || "https://api.bonkdrop.fr/upload";
const INTERNAL_API_KEY = process.env.BONKDROP_INTERNAL_API_KEY;
const UPSTREAM_TIMEOUT_MS = Number(process.env.BONKDROP_UPLOAD_TIMEOUT_MS || 45000);

const ALLOWED_ORIGINS = new Set([
	"https://bonkdrop.fr",
	"https://www.bonkdrop.fr",
	"https://bonkdrop.github.io",
	"http://localhost:3000",
]);

// Serveur les fichiers statiques
app.use(express.static(path.join(__dirname), {
	setHeaders: (res, filePath) => {
		if (filePath.endsWith('.html')) {
			res.setHeader('Content-Type', 'text/html');
		}
	}
}));

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

	if (!INTERNAL_API_KEY) {
		res.status(500).json({ success: false, error: "MISSING_SERVER_API_KEY" });
		return;
	}

	try {
		const headers = {};

		// Copier les headers pertinents de la requête client
		if (req.headers["content-type"]) {
			headers["content-type"] = req.headers["content-type"];
		}

		headers["x-api-key"] = INTERNAL_API_KEY;

		if (req.headers.authorization) {
			headers.authorization = req.headers.authorization;
		}

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

		let upstreamResponse;
		try {
			// Faire la requête en transférant le stream du corps
			upstreamResponse = await fetch(INTERNAL_UPLOAD_URL, {
				method: "POST",
				headers,
				body: req,
				signal: controller.signal,
				duplex: "half",
			});
		} finally {
			clearTimeout(timeoutId);
		}

		const contentType = upstreamResponse.headers.get("content-type") || "application/json";
		res.status(upstreamResponse.status);
		res.setHeader("Content-Type", contentType);

		const textBody = await upstreamResponse.text();
		res.send(textBody);
	} catch (error) {
		if (error && error.name === "AbortError") {
			res.status(504).json({ success: false, error: "UPLOAD_TIMEOUT" });
			return;
		}

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
