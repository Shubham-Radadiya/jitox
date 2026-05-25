/**
 * One-time setup: obtain GMAIL_REFRESH_TOKEN for Gmail API (HTTPS) on Render.
 *
 * 1. Google Cloud Console → APIs → enable Gmail API
 * 2. OAuth consent screen (External) → add your Gmail as test user
 * 3. Credentials → OAuth client ID → Desktop app (or Web with redirect below)
 * 4. Put GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env.local
 * 5. Run: npm run gmail:oauth
 * 6. Copy printed GMAIL_REFRESH_TOKEN to Render env vars
 */
import http from "http";
import path from "path";
import { URL } from "url";
import dotenv from "dotenv";
import { GMAIL_SEND_SCOPE } from "../src/helper/gmailApi";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.development") });

const CLIENT_ID = process.env.GMAIL_CLIENT_ID?.trim();
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET?.trim();
const REDIRECT_URI =
  process.env.GMAIL_REDIRECT_URI?.trim() || "http://localhost:3333/oauth2callback";
const PORT = Number(process.env.GMAIL_OAUTH_PORT || 3333);

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env.local first."
  );
  process.exit(1);
}

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", CLIENT_ID);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", GMAIL_SEND_SCOPE);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");

async function exchangeCode(code: string): Promise<void> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  const data = (await res.json()) as {
    refresh_token?: string;
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok) {
    console.error("Token exchange failed:", data);
    process.exit(1);
  }

  if (!data.refresh_token) {
    console.error(
      "No refresh_token in response. Revoke app access at https://myaccount.google.com/permissions and run again with prompt=consent."
    );
    process.exit(1);
  }

  console.log("\n--- Add to Render (and .env.local) ---\n");
  console.log(`GMAIL_REFRESH_TOKEN=${data.refresh_token}`);
  console.log("\nAlso set EMAIL_USER=shubhamradadiya@gmail.com");
  console.log("EMAIL_TRANSPORT=auto  (or gmail_api)\n");
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);
  if (url.pathname !== "/oauth2callback") {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const code = url.searchParams.get("code");
  const err = url.searchParams.get("error");
  if (err) {
    res.writeHead(400);
    res.end(`OAuth error: ${err}`);
    console.error("OAuth error:", err);
    process.exit(1);
  }

  if (!code) {
    res.writeHead(400);
    res.end("Missing code");
    return;
  }

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(
    "<h1>Success</h1><p>Copy GMAIL_REFRESH_TOKEN from the terminal, then close this tab.</p>"
  );

  await exchangeCode(code);
  server.close();
  process.exit(0);
});

server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
  console.log("\nOpen this URL in your browser (sign in as shubhamradadiya@gmail.com):\n");
  console.log(authUrl.toString());
  console.log("");
});
