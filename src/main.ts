import "reflect-metadata";
import {Container} from "inversify";

import "./config";

import {readFileSync} from "fs";

import * as http from "http";
import * as https from "https";

import {getConnection} from "./data/repository/Orm";

import {bindings} from "./di/bindings";
import {DIKey} from "./di/symbols";

import {Handler} from "./handler/Handler";

import {env, envx} from "./helper/functions";
import {logger} from "./helper/logger";

const main = async () => {
    const connection = await getConnection();
    const injector = new Container();
    injector.load(bindings(connection));

    const handlers = injector.getAll<Handler>(DIKey.HANDLER);
    if (handlers.length === 0) logger().error("No handler defined. Exiting...");
    handlers.forEach(handler => {
        const requestHandler = handler.requestHandler();

        // In production we only want https
        const server = env("NODE_ENV") === "onHost" && handler.protocol() === "http"
            ? http.createServer(requestHandler)
            : https.createServer(loadSSLOptions(), requestHandler);

        const port = handler.port();
        server.listen(port);
        server.on("error", error => onError(error, handler));
        server.on("listening", () => onListening(server, handler));
    });

    function loadSSLOptions(): https.ServerOptions {
        const options: https.ServerOptions = {
            cert: readFileSync(envx("SSL_CERT_FILE"), "utf8"),
            key: readFileSync(envx("SSL_KEY_FILE"), "utf8")
        };

        const ca = env("SSL_CA_FILE");
        if (typeof ca === "string") options.ca = readFileSync(ca);
        return options;
    }

    function onError(error: NodeJS.ErrnoException, handler: Handler): void {
        logger().error(`Spotted an irrecoverable error in handler(${handler.id()})`);

        if (error.syscall !== "listen") throw error;

        const port = handler.port();
        const pipeOrPort = (typeof port === "string")
            ? `pipe(${port})`
            : `port(${port})`;

        switch (error.code) {
            case "EACCES":
                logger().error(`Accessing ${pipeOrPort} requires elevated privileges`);
                process.exit(1);
                break;

            case "EADDRINUSE":
                logger().error(`${pipeOrPort} is already in use`);
                process.exit(1);
                break;

            default:
                throw error;
        }
    }

    function onListening(server: http.Server | https.Server, handler: Handler): void {
        const addr = server.address();
        const pipeOrPort = (typeof addr === "string")
            ? `pipe(${addr})`
            : `port(${addr.port})`;

        logger().info(`Server(${handler.id()}) is listening on ${pipeOrPort}`);
    }
};

main();

