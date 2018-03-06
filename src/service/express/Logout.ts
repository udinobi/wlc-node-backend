import {Request, Response} from "express";
import {inject, injectable} from "inversify";

import {ExpressService} from "./ExpressService";
import {registerAccess} from "./functions";

import {Credential} from "../../data/entity/Credential";

import {AccessOutcome} from "../../data/model/Access";

import {Repository} from "../../data/repository/Repository";

import {DIKey} from "../../di/symbols";

import {doNothing, hasNoValue, sendRedirect, sendResponse} from "../../helper/functions";
import {logger} from "../../helper/logger";

@injectable()
export class Logout implements ExpressService {

    @inject(DIKey.REPOSITORY)
    private repo: Repository;

    public reply(req: Request, res: Response) {
        const session = req.session;
        if (hasNoValue(session)) {
            logger().error("CSRF protection: illegal request(logout)");
            return;
        }

        const credentialId = session.credential;
        const language = session.language;
        session.destroy(doNothing);
        res.redirect(307, `/${language}`);

        if (typeof credentialId !== "string") return;

        const clientIPs = req.ips.length === 0 ? req.ip : req.ips.join(", ");

        this.repo.findOne<Credential>("Credential", { id : credentialId })
            .then(credential =>
                registerAccess(this.repo, Credential.fromEntity(credential), AccessOutcome.logout, clientIPs, req, res))
            .catch(error => {
                const text = `Error while searching credential by id (${credentialId}). IP(${clientIPs})\n${error}`;
                logger().error(text);
            });
    }
}
