import * as bodyParser from "body-parser";
import * as debug from "debug";
import * as express from "express";
import * as session from "express-session";
import * as helmet from "helmet";

import {injectable, multiInject, tagged} from "inversify";

import {Handler, RequestHandler} from "./Handler";

import {env, normalizePort} from "../helper/functions";
import {logger} from "../helper/logger";
import {Maybe} from "../helper/maybe";
import {protocol} from "../helper/protocol";

import {DIKey, DITag} from "../di/symbols";

import {Router} from "../routing/Router";

debug("ts-express:server");

@injectable()
export class ExpressHandler implements Handler {

    private app: express.Application;

    constructor(@multiInject(DIKey.ROUTER) @tagged(DITag.EXPRESS_ROUTER, true) routers: Router[]) {
        if (routers.length === 0) {
            logger().warning("No router defined for the Express handler");
        } else {
            this.app = express();

            const port = normalizePort(env("EXPRESS_PORT") || 8080);
            this.app.set("port", port);

            this.app.disable("x-powered-by");
            this.app.enable("trust proxy");

            this.middleware(routers);
        }
    }

    private origins = Maybe.from(env("CORS_PORT"))
        .map(_ => new Set([
            "http://localhost:" + _,
            "http://127.0.0.1:" + _
        ]))
        .getOrElse(new Set());

    private cors() {
        this.app.options("/*", (req: express.Request, res: express.Response) => {
            const code: number = Maybe.from(req.headers.origin as string)
                .map(origin => {
                    if (this.origins.has(origin)) {
                        res.header("Access-Control-Allow-Credentials", "true");
                        res.header("Access-Control-Allow-Origin", origin);
                        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type");
                        res.header("Access-Control-Allow-Methods", "DELETE, GET, POST, OPTIONS");
                        return 200;
                    }

                    return 401;
                }).getOrElse(401);

            res.send(code);
        });
    }

    private middleware(routers: Router[]): void {
        this.app.use(protocol());
        this.app.use(helmet());

        // Setting a stringent limit as for the time being we do not
        // expect (and do not want) to receive oversized messages.

        // for parsing application/json
        this.app.use(bodyParser.json({limit: "32768"}));

        // for parsing application/x-www-form-urlencoded
        this.app.use(bodyParser.urlencoded({
            extended: false,
            limit: "32768"
        }));

        const maxAge = 1000 * 60 * 60 * 24; // 24 hours
        const cookie: express.CookieOptions = {
            domain : env("EXPRESS_DOMAIN"),
            httpOnly : true,
            maxAge : maxAge,
            secure : env("NODE_ENV") !== "onHost"
        };

        this.app.use(session({
            cookie : cookie,
            name : "wlc-api-node",
            resave : false,
            saveUninitialized : false,
            secret : env("SESSION_KEY"),
            unset : "destroy"
        }));

        routers.forEach(router => router.bound(this));
        this.cors();
}

    /** @implements Handler */
    public id(): string {
        return "Express";
    }

    /** @implements Handler */
    public port(): number|string|boolean {
        return this.app.get("port");
    }

    /** @implements Handler */
    public protocol(): string {
        return env("EXPRESS_PROTOCOL") || "http";
    }

    /** @implements Handler */
    public requestHandler(): RequestHandler {
        return this.app;
    }
}
