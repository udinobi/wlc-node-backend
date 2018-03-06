import {Request, Response} from "express";
import {inject, injectable} from "inversify";

import {ExpressService} from "./ExpressService";
import {isLocalhost} from"./functions";

import {Credential} from "../../data/entity/Credential";

import {Credential as CredentialModel} from "../../data/model/Credential";

import {Repository} from "../../data/repository/Repository";

import {DIKey} from "../../di/symbols";

import {sendJSON, sendResponse, validFor2Millis} from "../../helper/functions";

@injectable()
export class AddCredential implements ExpressService {

    @inject(DIKey.REPOSITORY)
    private repo: Repository;

    public reply(req: Request, res: Response) {
        // We do nothing and not send any response if the request is not from localhost.
        if (!isLocalhost(req)) return;

        const body = req.body;
        const validFor = validFor2Millis(body);

        const model = new CredentialModel(body.username, body.password, Date.now() + validFor, body.resource);

        this.repo.save<Credential>("Credential", Credential.fromModel(model).get())
            .then(credential => sendJSON(res, 200, { id: credential.id }))
            .catch(error => sendResponse(res, 500, error));
    }
}
