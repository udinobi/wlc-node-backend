import {Application} from "express";
import {inject, injectable, tagged} from "inversify";

import {Router} from "../Router";

import {DIKey, DITag} from "../../di/symbols";

import {Handler} from "../../handler/Handler";

import {envx} from "../../helper/functions";

import {ExpressService} from "../../service/express/ExpressService";

@injectable()
export class LoginRouter implements Router {

    @inject(DIKey.EXPRESS_SERVICE)
    @tagged(DITag.SERVICE_AUTHORIZE, true)
    private authorize: ExpressService;

    @inject(DIKey.EXPRESS_SERVICE)
    @tagged(DITag.SERVICE_IS_AUTHORIZED, true)
    private isAuthorized: ExpressService;

    @inject(DIKey.EXPRESS_SERVICE)
    @tagged(DITag.SERVICE_LOGOUT, true)
    private logout: ExpressService;

    public bound(handler: Handler): void {
        const path = `${envx("API_PROXY_EP")}${envx("API_AUTH")}`;
        const express = handler.requestHandler() as Application;
        express.get(`${path}/logout`, (req, res, next) => this.logout.reply(req, res));
        express.get(path, (req, res, next) => this.isAuthorized.reply(req, res));
        express.post(path, (req, res, next) => this.authorize.reply(req, res));
    }
}
