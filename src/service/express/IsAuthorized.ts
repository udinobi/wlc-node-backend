import {Request, Response} from "express";
import {injectable} from "inversify";

import {ExpressService} from "./ExpressService";

import {illegalRequest} from "./functions";

import {hasNoValue, hasValue, sendResponse} from "../../helper/functions";

import {logger} from "../../helper/logger";

@injectable()
export class IsAuthorized implements ExpressService {

    public reply(req: Request, res: Response) {
        const session = req.session;
        if (illegalRequest(req) || hasNoValue(session)) {
            logger().error("CSRF protection: illegal request(isAuthorized)");
        } else {
            const auth = session.authorized === "yes"
                && hasValue(session.language)
                && hasValue(session.resource);
            sendResponse(res, 200, `${auth}`);
        }
    }
}
