import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const distDir = path.join(root, "dist");
const port = Number(process.env.PORT || "4173");
const host = process.env.HOST || "127.0.0.1";

await runBuild();

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${port}`);
  let target = path.join(distDir, decodeURIComponent(url.pathname));

  try {
    const stats = await fs.stat(target);
    if (stats.isDirectory()) {
      target = path.join(target, "index.html");
    }
  } catch {
    if (!path.extname(target)) {
      target = path.join(target, "index.html");
    }
  }

  try {
    const contents = await fs.readFile(target);
    response.writeHead(200, {
      "content-type": contentType(target)
    });
    response.end(contents);
  } catch {
    const notFound = await fs.readFile(path.join(distDir, "404.html"));
    response.writeHead(404, {
      "content-type": "text/html; charset=utf-8"
    });
    response.end(notFound);
  }
});

server.listen(port, host, () => {
  process.stdout.write(`Previewing rara-wiki at http://${host}:${port}\n`);
});

async function runBuild() {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join("scripts", "build.mjs")], {
      cwd: root,
      stdio: "inherit"
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`build failed with exit code ${code}`));
    });
  });
}

function contentType(file) {
  if (file.endsWith(".css")) {
    return "text/css; charset=utf-8";
  }
  if (file.endsWith(".js")) {
    return "text/javascript; charset=utf-8";
  }
  if (file.endsWith(".json")) {
    return "application/json; charset=utf-8";
  }
  if (file.endsWith(".svg")) {
    return "image/svg+xml";
  }
  return "text/html; charset=utf-8";
}
