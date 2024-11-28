#!/usr/bin/env node

const http = require("http");
const fs = require("fs");
const path = require("path");
const port = process.argv[3] || process.env.PORT || 8080;
const wd = path.join(process.cwd(), process.argv[2] || "");
const mime_map = require("./output.json");

const requestListener = async function (req, res) {
  let ext = "";
  req.url.endsWith("/") && (req.url += "index.html");
  req.url = decodeURI(req.url);
  ext = path.extname(req.url);
  console.log(
    `%cStarted loading ${req.url} (${mime_map[ext]})`,
    "color:yellow"
  );

  try {
    const filePath = path.join(wd, req.url);
    const stat = fs.statSync(filePath);

    mime_map[ext] && res.setHeader("Content-Type", mime_map[ext]);
    res.setHeader("Content-Length", stat.size);
    res.setHeader("Accept-Ranges", "bytes");

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

    stream.on("error", (err) => {
      console.error("Error streaming file:", err);
      res.writeHead(500);
      res.end("An error occurred. Please try again later.");
    });
  } catch (error) {
    let error_code, error_msg;
    switch (error.code) {
      case "ENOENT":
        error_code = 400;
        error_msg = "The request resource was not found.";
        break;
      default:
        error_code = 500;
        error_msg = "An error occurred. Please try again later.";
        console.log("error_code: ", error.code);
        break;
    }
    console.error(`%cError streaming file: ${req.url}`, "color:red");
    res.writeHead(error_code);
    res.end(error_msg);
  }
};

const server = http.createServer(requestListener);

server.listen(port, () => {
  console.log(
    `%cServer is running\nLocation: ${wd}\nAddress: 127.0.0.1:${port}\n`,
    "color:green"
  );
});
