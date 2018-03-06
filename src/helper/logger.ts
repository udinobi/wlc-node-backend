import {existsSync, mkdirSync} from "fs";
import {Logger, LoggerInstance, LoggerOptions, transports} from "winston";

import {env, toCurrentTime, hasNoValue} from "./functions";

export const logdir = `${process.cwd()}/logs`;

export function consoleLogger(colorize: boolean): LoggerInstance {
    return new Logger({
        exitOnError : false,
        transports : [
            new transports.Console({
                colorize : colorize,
                handleExceptions : true,
                json : false,
                level : env("CONSOLE_LOG_LEVEL") || "debug"
            })
        ]
    });
}

/**
 * @param filename Name of the log file. The suffix ".log" is already appended to filename.
 */
export function fileLogger(filename: string, level: string): LoggerInstance {
    if (!existsSync(logdir)) mkdirSync(logdir);

    return new Logger(<LoggerOptions> {
        exitOnError : false,
        transports : [
            new(require("winston-daily-rotate-file")) ({
                colorize : false,
                filename : `${logdir}/${filename}.log`,
                handleExceptions : true,
                json : true,
                level : level,
                maxFiles : 5,
                maxsize : 10485760, // 10MB
                name: filename,
                timestamp : () => toCurrentTime()
            })
        ]
    });
}

let application_logger;

export function logger(): LoggerInstance {
    if (hasNoValue(application_logger)) {
        application_logger = env("NODE_ENV") !== "prod"
            ? consoleLogger(true)
            : fileLogger("application", env("LOG_LEVEL_APPLICATION") || "info");
    }

    return application_logger;
}
