import {IncomingMessage, ServerResponse} from "http";

export type RequestHandler = (request: IncomingMessage, response: ServerResponse) => void;

export interface Handler {

    id(): string;

    port(): number|string|boolean;

    protocol(): string;

    requestHandler(): RequestHandler;
}
