#!/usr/bin/env python3
import os
import base64
import json
import subprocess
import urllib.request
import urllib.error

# Load environment variables from .env if present
env_vars = {}
if os.path.exists(".env"):
    with open(".env", "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env_vars[k.strip()] = v.strip()

# ==============================================================================
# CONFIGURATION & CREDENTIALS
# ==============================================================================
GITHUB_REPO = "https://github.com/testking932-star/Screens.git"

CLOUDFLARE_ACCOUNT_ID = "9fdc6d6dd3fbc47ec09bc39dcd9ad81a"
CLOUDFLARE_WORKER_NAME = "screens"
CLOUDFLARE_API_TOKEN = env_vars.get("CLOUDFLARE_API_TOKEN") or os.environ.get("CLOUDFLARE_API_TOKEN", "")

SERVER_MERCHANT_ID = "CZ1GKW98EHFT1"
SERVER_CLOVER_TOKEN = env_vars.get("SERVER_CLOVER_TOKEN") or os.environ.get("SERVER_CLOVER_TOKEN", "")

# Website Authentication Credentials
AUTH_USERNAME = "Kushi"
AUTH_PASSWORD = "Kgf@2025"

# Compute HTTP Basic Auth String
expected_auth_str = "Basic " + base64.b64encode(f"{AUTH_USERNAME}:{AUTH_PASSWORD}".encode("utf-8")).decode("utf-8")

def build_worker():
    print("🔨 [1/3] Building self-contained Cloudflare Worker script (_worker.js)...")
    
    with open("index.html", "r", encoding="utf-8") as f:
        html_content = f.read()

    with open("style.css", "r", encoding="utf-8") as f:
        css_content = f.read()

    with open("app.js", "r", encoding="utf-8") as f:
        js_content = f.read()

    images = {}

    if os.path.exists("logo-Cs-5la-o.png"):
        with open("logo-Cs-5la-o.png", "rb") as f:
            images["/logo-Cs-5la-o.png"] = {
                "mime": "image/png",
                "data": base64.b64encode(f.read()).decode("utf-8")
            }

    if os.path.exists("bg_opt.jpg"):
        with open("bg_opt.jpg", "rb") as f:
            images["/bg_opt.jpg"] = {
                "mime": "image/jpeg",
                "data": base64.b64encode(f.read()).decode("utf-8")
            }

    config_data = {}
    if os.path.exists("config.json"):
        try:
            with open("config.json", "r", encoding="utf-8") as f:
                config_data = json.load(f)
        except Exception:
            pass

    worker_code = f"""const HTML_DOC = {json.dumps(html_content)};
const CSS_DOC = {json.dumps(css_content)};
const JS_DOC = {json.dumps(js_content)};
const IMAGES = {json.dumps(images)};
const DEFAULT_MERCHANT_ID = {json.dumps(SERVER_MERCHANT_ID)};
const DEFAULT_TOKEN = {json.dumps(SERVER_CLOVER_TOKEN)};
const EXPECTED_AUTH = {json.dumps(expected_auth_str)};
let SAVED_CONFIG = {json.dumps(config_data)};

addEventListener("fetch", (event) => {{
    event.respondWith(handleRequest(event.request));
}});

function base64ToUint8Array(base64) {{
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {{
        bytes[i] = binaryString.charCodeAt(i);
    }}
    return bytes;
}}

async function handleRequest(request) {{
    const url = new URL(request.url);
    const path = url.pathname;

    // 0. USERNAME & PASSWORD AUTHENTICATION GUARD WITH COOKIE DEVICE PERSISTENCE
    if (request.method !== "OPTIONS") {{
        const reqAuthHeader = request.headers.get("Authorization");
        const cookieHeader = request.headers.get("Cookie") || "";
        const hasValidCookie = cookieHeader.includes("app_auth_session=granted_kushi_2025");

        if (!hasValidCookie && (!reqAuthHeader || reqAuthHeader !== EXPECTED_AUTH)) {{
            return new Response("Unauthorized Access. Authentication Required.", {{
                status: 401,
                headers: {{
                    "WWW-Authenticate": "Basic realm=\\"Clover Menu Hub Security\\"",
                    "Content-Type": "text/plain; charset=utf-8",
                    "Access-Control-Allow-Origin": "*",
                }},
            }});
        }}
    }}

    // CONFIG PERSISTENCE API
    if (path.startsWith("/api/config")) {{
        if (request.method === "OPTIONS") {{
            return new Response(null, {{
                status: 204,
                headers: {{
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "*",
                }}
            }});
        }}
        if (request.method === "POST") {{
            try {{
                const body = await request.json();
                SAVED_CONFIG = body;
                return new Response(JSON.stringify({{ status: "ok" }}), {{
                    headers: {{ "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }}
                }});
            }} catch (err) {{
                return new Response(JSON.stringify({{ error: err.message }}), {{
                    status: 400,
                    headers: {{ "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }}
                }});
            }}
        }}
        return new Response(JSON.stringify(SAVED_CONFIG || {{}}), {{
            headers: {{ "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }}
        }});
    }}

    // 1. CLOVER API PROXY HANDLER (WITH FULL PRIVACY SHIELD FOR ID & TOKEN)
    if (path.startsWith("/clover-api/")) {{
        let remotePath = path.replace("/clover-api", "");

        if (!remotePath.startsWith("/merchants/")) {{
            remotePath = `/merchants/${{DEFAULT_MERCHANT_ID}}${{remotePath}}`;
        }}

        remotePath += url.search;

        if (request.method === "OPTIONS") {{
            return new Response(null, {{
                status: 204,
                headers: {{
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Max-Age": "86400",
                }},
            }});
        }}

        const envHeader = request.headers.get("X-Clover-Env") || "prod";
        const baseUrl = envHeader === "prod"
            ? "https://api.clover.com/v3"
            : "https://apisandbox.dev.clover.com/v3";

        const targetUrl = `${{baseUrl.replace(/\\/$/, "")}}${{remotePath}}`;

        const forwardHeaders = new Headers();
        for (const [key, value] of request.headers.entries()) {{
            if (!["host", "content-length", "connection", "accept-encoding", "authorization"].includes(key.toLowerCase())) {{
                forwardHeaders.set(key, value);
            }}
        }}

        // Inject Clover API Authorization Token (Override HTTP Basic Auth header)
        if (DEFAULT_TOKEN) {{
            forwardHeaders.set("Authorization", `Bearer ${{DEFAULT_TOKEN}}`);
        }}

        const init = {{
            method: request.method,
            headers: forwardHeaders,
        }};

        if (!["GET", "HEAD"].includes(request.method)) {{
            init.body = request.body;
        }}

        try {{
            const response = await fetch(targetUrl, init);

            const resHeaders = new Headers();
            for (const [key, value] of response.headers.entries()) {{
                if (!["transfer-encoding", "content-encoding", "connection"].includes(key.toLowerCase())) {{
                    resHeaders.set(key, value);
                }}
            }}
            resHeaders.set("Access-Control-Allow-Origin", "*");

            return new Response(response.body, {{
                status: response.status,
                statusText: response.statusText,
                headers: resHeaders,
            }});
        }} catch (err) {{
            return new Response(`Clover Proxy Error: ${{err.message}}`, {{
                status: 500,
                headers: {{
                    "Content-Type": "text/plain",
                    "Access-Control-Allow-Origin": "*",
                }},
            }});
        }}
    }}

    // 2. STATIC ASSETS & IMAGES
    if (path === "/style.css" || path.startsWith("/style.css")) {{
        return new Response(CSS_DOC, {{
            headers: {{ "Content-Type": "text/css; charset=utf-8", "Access-Control-Allow-Origin": "*" }}
        }});
    }}

    if (path === "/app.js" || path.startsWith("/app.js")) {{
        return new Response(JS_DOC, {{
            headers: {{ "Content-Type": "application/javascript; charset=utf-8", "Access-Control-Allow-Origin": "*" }}
        }});
    }}

    // Serve images if requested
    const decodedPath = decodeURIComponent(path);
    const imgObj = IMAGES[decodedPath] || IMAGES[path];
    if (imgObj) {{
        const bytes = base64ToUint8Array(imgObj.data);
        return new Response(bytes, {{
            headers: {{ "Content-Type": imgObj.mime, "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=86400" }}
        }});
    }}

    // Serve index.html for root and all app routes
    return new Response(HTML_DOC, {{
        headers: {{
            "Content-Type": "text/html; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Set-Cookie": "app_auth_session=granted_kushi_2025; Path=/; Max-Age=315360000; SameSite=Lax"
        }}
    }});
}}
"""

    with open("_worker.js", "w", encoding="utf-8") as f:
        f.write(worker_code)

    print("✅ Build complete!")

def deploy_cloudflare():
    print("☁️ [2/3] Deploying to Cloudflare Worker...")
    if not CLOUDFLARE_API_TOKEN:
        print("❌ Error: CLOUDFLARE_API_TOKEN not found in .env file.")
        return

    url = f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/workers/scripts/{CLOUDFLARE_WORKER_NAME}"
    
    with open("_worker.js", "rb") as f:
        data = f.read()

    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}",
            "Content-Type": "application/javascript"
        },
        method="PUT"
    )

    try:
        with urllib.request.urlopen(req) as resp:
            res_text = resp.read().decode("utf-8")
            res_json = json.loads(res_text)
            if res_json.get("success"):
                print("🚀 Successfully deployed to Cloudflare Worker!")
            else:
                print("❌ Cloudflare Deployment Error:", res_json)
    except urllib.error.HTTPError as e:
        print("❌ Cloudflare API Error:", e.read().decode("utf-8"))

def push_github(commit_msg="Update project files and worker build"):
    print("🐙 [3/3] Committing and pushing to GitHub...")
    subprocess.run(["git", "add", "."], check=False)
    subprocess.run(["git", "commit", "-m", commit_msg], check=False)
    subprocess.run(["git", "push", "origin", "main"], check=False)
    print("✅ GitHub push complete!")

if __name__ == "__main__":
    build_worker()
    deploy_cloudflare()
    push_github()
    print("\n🎉 Deployment complete! Live URL: https://screens.testking932.workers.dev")
