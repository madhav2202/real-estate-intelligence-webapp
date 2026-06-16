import { createServer } from "node:http";
import { readFile, stat, appendFile, mkdir } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = Number(process.env.PORT || 8000);
const leadsFile = path.join(__dirname, "data", "leads.ndjson");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jsx": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

async function maybeSendLeadEmail(lead) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_EMAIL || "madhav.prakash@propertyspotters.in";
  if (!apiKey) return;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "PropSpot Plinth <madhav.prakash@propertyspotters.in>",
      to: [to],
      subject: `New PropSpot Plinth lead for ${lead.projectName}`,
      html: `
        <h2>New lead from PropSpot Plinth</h2>
        <p><strong>Project:</strong> ${lead.projectName}</p>
        <p><strong>Name:</strong> ${lead.name}</p>
        <p><strong>Phone:</strong> ${lead.phone}</p>
        <p><strong>Email:</strong> ${lead.email}</p>
        <p><strong>Budget:</strong> ${lead.budget || "-"}</p>
        <p><strong>Buying Timeline:</strong> ${lead.timeline || "-"}</p>
        <p><strong>Preferred Location:</strong> ${lead.preferredLocation || "-"}</p>
        <p><strong>Notes:</strong> ${lead.notes || "-"}</p>
      `,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend failed: ${text}`);
  }
}

async function handleLeadRequest(req, res) {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", async () => {
    try {
      const lead = JSON.parse(body || "{}");
      if (!lead.name || !lead.phone || !lead.email) {
        return sendJson(res, 400, { error: "name, phone, and email are required" });
      }
      await mkdir(path.dirname(leadsFile), { recursive: true });
      await appendFile(leadsFile, JSON.stringify({ ...lead, createdAt: new Date().toISOString() }) + "\n");
      await maybeSendLeadEmail(lead);
      sendJson(res, 200, { ok: true });
    } catch (error) {
      console.error(error);
      sendJson(res, 500, { error: "unable to capture lead right now" });
    }
  });
}

async function resolvePath(urlPath) {
  if (urlPath === "/" || urlPath === "/index.html" || urlPath === "/map" || urlPath === "/screener" || urlPath === "/terminal") return path.join(__dirname, "index.html");
  if (urlPath === "/properties" || urlPath === "/properties/") return path.join(__dirname, "properties.html");
  if (urlPath === "/commute" || urlPath === "/commute/") return path.join(__dirname, "commute-intelligence.html");
  if (urlPath === "/recommend" || urlPath === "/recommend/") return path.join(__dirname, "recommendation-onboarding.html");
  if (urlPath.startsWith("/projects/")) return path.join(__dirname, "project.html");

  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
  return path.join(__dirname, safePath);
}

createServer(async (req, res) => {
  if (!req.url) return sendJson(res, 400, { error: "invalid request" });
  const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "POST" && requestUrl.pathname === "/api/leads") {
    return handleLeadRequest(req, res);
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/google-maps-key") {
    return sendJson(res, 200, {
      apiKey: process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_BROWSER_KEY || "",
    });
  }

  const filePath = await resolvePath(requestUrl.pathname);
  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      res.writeHead(302, { Location: "/" });
      return res.end();
    }
    const ext = path.extname(filePath);
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });
    createReadStream(filePath).pipe(res);
  } catch {
    if (requestUrl.pathname === "/favicon.ico" && !existsSync(path.join(__dirname, "favicon.ico"))) {
      res.writeHead(204);
      return res.end();
    }
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}).listen(port, () => {
  console.log(`PropSpot Plinth running on http://localhost:${port}`);
});
