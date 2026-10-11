import fs from "node:fs";
import http from "node:http";
import net from "node:net";

function upstreamPort() {
  try {
    const lock = JSON.parse(fs.readFileSync(new URL("../.next/dev/lock", import.meta.url), "utf8"));
    if (Number.isFinite(lock.port)) return lock.port;
  } catch {}
  return 3000;
}

function proxyRequest(req, res) {
  const port = upstreamPort();
  const proxy = http.request(
    {
      hostname: "127.0.0.1",
      port,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `localhost:${port}` },
    },
    (upstream) => {
      res.writeHead(upstream.statusCode ?? 502, upstream.headers);
      upstream.pipe(res);
    }
  );
  proxy.on("error", () => {
    if (!res.headersSent) res.writeHead(502);
    res.end();
  });
  req.pipe(proxy);
}

const server = http.createServer(proxyRequest);

server.on("upgrade", (req, socket, head) => {
  const port = upstreamPort();
  const upstream = net.connect(port, "127.0.0.1", () => {
    const lines = [`${req.method} ${req.url} HTTP/1.1`];
    for (const [key, value] of Object.entries(req.headers)) {
      if (value == null) continue;
      const headerValue = Array.isArray(value) ? value.join(", ") : value;
      lines.push(`${key.toLowerCase() === "host" ? "host" : key}: ${key.toLowerCase() === "host" ? `localhost:${port}` : headerValue}`);
    }
    upstream.write(`${lines.join("\r\n")}\r\n\r\n`);
    if (head.length) upstream.write(head);
    upstream.pipe(socket);
    socket.pipe(upstream);
  });
  const close = () => {
    socket.destroy();
    upstream.destroy();
  };
  upstream.on("error", close);
  socket.on("error", close);
});

server.listen(3377, "127.0.0.1", () => {
  console.log(`porta 3377 pronta, verso ${upstreamPort()}`);
});
