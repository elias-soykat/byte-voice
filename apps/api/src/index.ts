import http from "http";
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { Server } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@repo/shared";
import { PORT, WEB_ORIGIN } from "./config/config";
import { swaggerSpec } from "./config/swagger";
import { registerSocketHandlers } from "./sockets/gateway";
import doctorsRouter from "./routes/doctors.routes";
import schedulesRouter from "./routes/schedules.routes";
import appointmentsRouter from "./routes/appointments.routes";
import exceptionsRouter from "./routes/exceptions.routes";
import analyticsRouter from "./routes/analytics.routes";
import knowledgeBaseRouter from "./routes/knowledgeBase.routes";
import agentRouter from "./routes/agent.routes";
import callsRouter from "./routes/call.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

const allowedOrigins = [
  WEB_ORIGIN,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
].filter(Boolean);

const isAllowedOrigin = (origin?: string): boolean => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  // In development, permit any localhost or 127.0.0.1 origin
  if (process.env.NODE_ENV !== "production" && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return true;
  }
  return false;
};

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/v1/doctors", doctorsRouter);
app.use("/api/v1/schedules", schedulesRouter);
app.use("/api/v1/appointments", appointmentsRouter);
app.use("/api/v1/exceptions", exceptionsRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/knowledgeBase", knowledgeBaseRouter);
app.use("/api/v1/agent", agentRouter);
app.use("/api/v1/calls", callsRouter);

app.use(errorHandler);

const server = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    credentials: true,
  },
});

io.engine.on("connection_error", (err) => {
  console.error(`[socket.io] Connection error (code ${err.code}):`, err.message);
});
registerSocketHandlers(io);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
