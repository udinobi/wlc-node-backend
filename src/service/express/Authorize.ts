import {Request, Response} from "express";
import {inject, injectable} from "inversify";

import {ExpressService} from "./ExpressService";
import {illegalRequest, registerAccess} from "./functions";
import {sendRedirect, sendResponse} from "../../helper/functions";

import {Credential} from "../../data/entity/Credential";

import {AccessOutcome} from "../../data/model/Access";
import {Credential as CredentialModel} from "../../data/model/Credential";

import {Repository} from "../../data/repository/Repository";

import {DIKey} from "../../di/symbols";

import {env, hasNoValue} from "../../helper/functions";
import {logger} from "../../helper/logger";
import {Maybe} from "../../helper/maybe";

@injectable()
export class Authorize implements ExpressService {

    @inject(DIKey.REPOSITORY)
    private repo: Repository;

    public reply(req: Request, res: Response) {
        if (illegalRequest(req) || hasNoValue(req.session)) {
            logger().error("CSRF protection: illegal request(authorize)");
            return;
        }

        if (req.session.authorized === "yes") {
            sendRedirect(res, `/${req.session.language}${env("API_AUTH")}${req.session.resource}`);
            return;
        }

        const username = req.body.username;
        if (typeof username !== "string"
        ||  typeof req.body.password !== "string") return;

        this.repo.findOne<Credential>("Credential", { username : username })
            .then(credential => this.verifyCredential(Credential.fromEntity(credential), req, res))
            .catch(error => {
                const clientIPs = req.ips.length === 0 ? req.ip : req.ips.join(", ");
                const user = req.body.username;
                const text = `Error while searching credential by username (${user}). IP(${clientIPs})\n${error}`;
                logger().error(text);
                sendResponse(res, 400, "cannot-authorize");
            });
    }

    private verifyCredential(credential: Maybe<CredentialModel>, req: Request, res: Response) {
        // Assume req.ip/req.ips are derived from "X-Forwarded-For" header after "express.enable('trust proxy')"
        const clientIPs = req.ips.length === 0 ? req.ip : req.ips.join(", ");

        credential.ifOrElse(_ => {
            let outcome: AccessOutcome;

            if (_.password !== req.body.password) {
                outcome = AccessOutcome.unauthorized;
            } else if (_.expireAt <= Date.now()) {
                outcome = AccessOutcome.expired;
            } else {
                outcome = AccessOutcome.successful;
            }

            registerAccess(this.repo, credential, outcome, clientIPs, req, res);
        },

        () => {
            const text = `Unknown Login username (${req.body.username}). IP(${clientIPs})`;
            logger().warn(text);
            sendResponse(res, 401, "unauthorized");
        });
    }
}
