// backend/src/index.ts
import cors from "cors";
import "dotenv/config";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { initSchema } from "./db";
import profilesRouter from "./routes/profiles";
import remindersRouter from "./routes/reminders";
import tasksRouter from "./routes/tasks";

const app = express();
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: false,
  }),
);
app.use(express.json({ limit: "5mb" }));

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Voice Profiler API",
    version: "1.0.0",
    description: "API documentation for Voice Profiler",
  },
  servers: [{ url: "http://localhost:4000" }],
  paths: {
    "/profiles": {
      get: {
        summary: "Get all profiles",
        responses: { "200": { description: "OK" } },
      },
      post: {
        summary: "Create profile",
        responses: { "201": { description: "Created" } },
      },
    },
    "/tasks": {
      get: {
        summary: "Get all tasks",
        responses: { "200": { description: "OK" } },
      },
      post: {
        summary: "Create task",
        responses: { "201": { description: "Created" } },
      },
    },
    "/reminders": {
      get: {
        summary: "Get all reminders",
        responses: { "200": { description: "OK" } },
      },
      post: {
        summary: "Create reminder",
        responses: { "201": { description: "Created" } },
      },
    },
  },
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/profiles", profilesRouter);
app.use("/tasks", tasksRouter);
app.use("/reminders", remindersRouter);

initSchema().then(() => {
  const port = Number(process.env.PORT) || 4000;
  app.listen(port, () => console.log(`API running on :${port}`));
});
