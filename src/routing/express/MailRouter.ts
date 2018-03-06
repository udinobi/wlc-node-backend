import {Application} from "express";
import {inject, injectable, tagged} from "inversify";

import {Router} from "../Router";

import {DIKey, DITag} from "../../di/symbols";

import {Handler} from "../../handler/Handler";

import {envx} from "../../helper/functions";

import {ExpressService} from "../../service/express/ExpressService";

@injectable()
export class MailRouter implements Router {

    @inject(DIKey.EXPRESS_SERVICE) @tagged(DITag.SERVICE_MAIL_CONFIRMATION, true)
    private mailConfirmation: ExpressService;

    @inject(DIKey.EXPRESS_SERVICE) @tagged(DITag.SERVICE_MAIL_VERIFICATION, true)
    private mailVerification: ExpressService;

    public bound(handler: Handler): void {
        const ep = `${envx("API_PROXY_EP")}`;
        const express = handler.requestHandler() as Application;
        express.get(`${ep}/${envx("EMAIL_URL_PATH")}/:id`, (req, res, next) => this.mailConfirmation.reply(req, res));
        express.post(`${ep}/email/verify`, (req, res, next) => this.mailVerification.reply(req, res));
    }
}
