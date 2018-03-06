import {Application} from "express";
import {inject, injectable, tagged} from "inversify";

import {Router} from "../Router";

import {DIKey, DITag} from "../../di/symbols";

import {Handler} from "../../handler/Handler";

import {envx, languages} from "../../helper/functions";

import {ExpressService} from "../../service/express/ExpressService";

@injectable()
export class AuthRouter implements Router {

    @inject(DIKey.EXPRESS_SERVICE)
    @tagged(DITag.SERVICE_SEND_ON_AUTH, true)
    private sendOnAuth: ExpressService;

    public bound(handler: Handler): void {
        const express = handler.requestHandler() as Application;
        languages().forEach(_ =>
            express.get(
                `/${_}${envx("API_AUTH")}/*`,
                (req, res, next) => this.sendOnAuth.reply(req, res))
        );
    }
}
