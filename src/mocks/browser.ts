import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";
import { socketHandlers } from "./socketHandlers";

export const worker = setupWorker(...handlers, ...socketHandlers);
