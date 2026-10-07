import sys

with open("packages/socket/src/index.ts", "r") as f:
    content = f.read()

# Add the /health endpoint to the http server
health_check_code = """
import { createServer } from "http"
const httpServer = createServer((req, res) => {
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }));
    return;
  }
})
"""

# Replace existing http server creation if it exists (usually const httpServer = createServer())
if "import { createServer } from \"http\"" not in content and "import http" not in content:
  # Just an approximation, we will find where httpServer is declared.
  pass

print("Looking for httpServer declaration...")
