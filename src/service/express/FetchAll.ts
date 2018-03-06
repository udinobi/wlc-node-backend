import {Request, Response} from "express";
import {inject, injectable} from "inversify";

import {ExpressService} from "./ExpressService";
import {isLocalhost} from"./functions";

import {Repository} from "../../data/repository/Repository";

import {DIKey} from "../../di/symbols";

import {hasNoValue, sendResponse} from "../../helper/functions";
import {logger} from "../../helper/logger";

@injectable()
export class FetchAll<T> implements ExpressService {

    @inject(DIKey.REPOSITORY)
    private repo: Repository;

    public reply(req: Request, res: Response) {
        // We do nothing and not send any response if the request is not from localhost.
        if (!isLocalhost(req)
        ||  hasNoValue(req.params)
        ||  typeof req.params.repository !== "string") return;

        const repository = String(req.params.repository);

        this.repo.fetchAll(repository)
            .then(entities => {
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.status(200).send(JSON.stringify(entities));
            })
            .catch(error => {
                const text = `Error while fetching <${repository}>'s rows\n${error}`;
                logger().error(text);
                sendResponse(res, 400, text);
            });
    }
}
