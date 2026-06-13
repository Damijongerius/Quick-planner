import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import authRoutes from "./routes/auth";
import projectRoutes from "./routes/projects";
import nodeTypeRoutes from "./routes/nodeTypes";
import sprintRoutes from "./routes/sprints";
import relationRoutes from "./routes/relations";
import nodeRoutes from "./routes/nodes";

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all requests since Tauri client is running on localhost/custom protocols
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Bind routers
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api", nodeTypeRoutes);
app.use("/api", sprintRoutes);
app.use("/api", relationRoutes);
app.use("/api", nodeRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(port, () => {
  console.log(`Backend server is running on port ${port}`);
});
