import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { handleApiRequest } from "./src/utils/api-handler";

const app = express();
app.use(express.json());

const PORT = 3000;

// Use our unified API handler middleware
app.use(async (req, res, next) => {
  await handleApiRequest(req, res, next);
});

// Vite middleware integration
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
