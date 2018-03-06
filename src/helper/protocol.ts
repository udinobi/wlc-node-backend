
/** Express logger */

import {RequestHandler} from "express";
import * as morgan from "morgan";

import {env} from "./functions";
import {consoleLogger, fileLogger} from "./logger";

let format;
let logger;

if (env("NODE_ENV") === "prod") {
    logger = fileLogger("protocol", env("LOG_LEVEL_PROTOCOL") || "warn");
    format = ":remote-addr - :remote-user [:date[iso]] :method :url "
           + "HTTP/:http-version :status :res[content-length] :referrer :user-agent";
} else {
    logger = consoleLogger(true);
    format = "dev";
}

logger.stream = {
    write: (message, encoding) => logger.info(message)
};

const _morgan = morgan(format, logger.stream);

export function protocol(): RequestHandler {
    return _morgan;
}
