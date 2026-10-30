
import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRouter from "./routes";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 5000;
const frontendOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

// Middleware
app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", apiRouter);

// Health check
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "TypeScript Express API is running",
  });
});

// API health endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
