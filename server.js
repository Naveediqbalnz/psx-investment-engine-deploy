const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 3000);
const mime = {
  ".html":"text/html; charset=utf-8",
  ".js":"application/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8",
  ".json":"application/json; charset=utf-8",
  ".svg":"image/svg+xml",
  ".png":"image/png",
  ".jpg":"image/jpeg",
  ".jpeg":"image/jpeg",
  ".ico":"image/x-icon"
};

http.createServer((req,res)=>{
  let pathname = decodeURIComponent((req.url || "/").split("?")[0]);
  if (pathname === "/") pathname = "/index.html";
  const rel = pathname.replace(/^\/+/, "");
  let file = path.join(root, rel);
  if (!file.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.stat(file,(err,st)=>{
    if (err || !st.isFile()) file = path.join(root,"index.html");
    fs.readFile(file,(readErr,data)=>{
      if (readErr) {
        res.writeHead(500);
        res.end("Server error");
        return;
      }
      const ext = path.extname(file).toLowerCase();
      res.setHeader("Content-Type", mime[ext] || "application/octet-stream");
      if (path.basename(file)==="config.js") res.setHeader("Cache-Control","no-store");
      res.writeHead(200);
      res.end(data);
    });
  });
}).listen(port,"0.0.0.0",()=>console.log("PSX portal listening on "+port));
