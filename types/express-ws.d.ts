import { Application } from "express";
import * as core from "express-serve-static-core";
import { Server as WebSocketServer } from "ws";

declare module "express-serve-static-core" {
  interface Application {
    ws: (
      path: string,
      wsHandler: (ws: WebSocket, req: Request) => void
    ) => void;
  }
}
