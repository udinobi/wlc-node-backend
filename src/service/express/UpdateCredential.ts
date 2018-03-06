import {Request, Response} from "express";
import {inject, injectable} from "inversify";

import {ExpressService} from "./ExpressService";
import {isLocalhost} from"./functions";

import {Credential} from "../../data/entity/Credential";

import {Credential as CredentialModel} from "../../data/model/Credential";

import {Repository} from "../../data/repository/Repository";

import {DIKey} from "../../di/symbols";

import {sendResponse, validFor2Millis} from "../../helper/functions";
import {logger} from "../../helper/logger";
import {Maybe} from "../../helper/maybe";

@injectable()
export class UpdateCredential implements ExpressService {

    @inject(DIKey.REPOSITORY)
    private repo: Repository;

    public reply(req: Request, res: Response) {
        // We do nothing and not send any response if the request is not from localhost.
        if (!isLocalhost(req)) return;

        const username = req.body.username;

        if (typeof username === "string") {
            this.repo.findOne<Credential>("Credential", { username : username })
                .then(credential => this.updateCredential(Credential.fromEntity(credential), req, res))
                .catch(error => sendResponse(res, 500, error));
        }
    }

    private updateCredential(credential: Maybe<CredentialModel>, req: Request, res: Response) {
        credential.ifOrElse(_ => {
            const body = req.body;

            const expireAt = this.updateExpireAt(body, _);
            const password = this.updatePassword(body, _);
            const resource = this.updateResource(body, _);

            if (expireAt.nonEmpty || password.nonEmpty || resource.nonEmpty) {
                this.repo.save<Credential>("Credential", Credential.fromModel(_).get())
                    .then(_credential => sendResponse(res, 200, `Credential(${_credential.id}) updated`))
                    .catch(error => sendResponse(res, 500, error));
            } else {
                sendResponse(res, 200, `Nothing to update for Credential(${_.id})`);
            }
        },
        () => {
            const text = `No Credential for username(${req.body.username})`;
            logger().warn(text);
            sendResponse(res, 404, text);
        });
    }

    private updateExpireAt = (body, credential: CredentialModel) =>
        Maybe.from(body.validFor)
            .map(_ => credential.expireAt = Date.now() + validFor2Millis(body))

    private updatePassword = (body, credential: CredentialModel) =>
        Maybe.from(body.password)
            .filter(_ => credential.password !== _)
            .map(_ => credential.password = _)

    private updateResource = (body, credential: CredentialModel) =>
        Maybe.from(body.resource)
            .filter(_ => credential.resource !== _)
            .map(_ => credential.resource = _)
}
