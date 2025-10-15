// backend/src/index.ts
import cors from "cors";
import "dotenv/config";
import express from "express";
import { initSchema } from "./db";
import profilesRouter from "./routes/profiles";
import remindersRouter from "./routes/reminders";
import tasksRouter from "./routes/tasks";

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: false }));
app.use(express.json({ limit: "5mb" }));

app.use("/profiles", profilesRouter);
app.use("/tasks", tasksRouter);
app.use("/reminders", remindersRouter);

initSchema().then(() => {
  const port = Number(process.env.PORT) || 4000;
  app.listen(port, () => console.log(`API running on :${port}`));
});
