import {Response} from "express";
import {readFile} from "fs";

import * as moment from "moment";
import "moment-timezone";

import {logger} from "./logger";

/* tslint:disable:no-empty */
export const doNothing = () => {};

export function env(param: string): string | undefined {
    return process.env[param];
}

export function envx(param: string): string {
    const ev = process.env[param];
    if (hasValue(ev)) return ev;

    const text = `Config param(${param}) must be specified.`;
    logger().error(text);
    throw text;
}

export function hasValue(value): boolean {
    return value !== null && value !== undefined;
}

export function hasNoValue(value): boolean {
    return value === null || value === undefined;
}

let _languages;

export function languages(): Set<string> {
    if (hasNoValue(_languages)) {
        _languages = new Set<string>(envx("SUPPORTED_LANGUAGES").split(","));
    }

    return _languages;
}

export function normalizePort(val: number|string): number|string|boolean {
    const port: number = (typeof val === "string")
        ? parseInt(val, 10)
        : val;

    if (isNaN(port)) return val;  // Named pipe

    return port >= 0 ? port : false;
}

export function sendHtml(res: Response, content: string) {
    res.setHeader("Content-Type", "text/html");
    res.send(content);
}

export function sendJSON(res: Response, status: number, body: Object) {
    res.status(status).json(body);
}

export function sendRedirect(res: Response, redirectTo: string) {
    res.status(200).json({
        redirectTo : redirectTo,
        status : 200
    });
}

export function sendResponse(res: Response, status: number, message: string) {
    res.status(status).json({
        message : message,
        status : status
    });
}

export function toCurrentTime() {
    return moment().tz(env("TZ")).format(env("DATE_FORMAT"));
}

export function toTime(millis: number) {
    return moment.unix(millis / 1000).format(env("DATE_FORMAT"));
}

export function validFor2Millis(body): number {
    let validFor = parseInt(body.validFor, 10);  // minutes

    if (isNaN(validFor)) return 1000 * 60 * 60 * 24;  // one day;

    validFor = Math.abs(validFor);
    switch (body.validType) {
        case "millis" :  return validFor;
        case "seconds" : return validFor *= 1000;
        case undefined :
        case "minutes" : return validFor *= 1000 * 60;
        case "hours" :   return validFor *= 1000 * 60 * 60;
        case "days" :    return validFor *= 1000 * 60 * 60 * 24;

        default :        return -1;
    }
}
