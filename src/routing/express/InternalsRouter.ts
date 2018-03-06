import {Application} from "express";
import {inject, injectable, tagged} from "inversify";

import {Router} from "../Router";

import {DIKey, DITag} from "../../di/symbols";

import {Handler} from "../../handler/Handler";

import {envx} from "../../helper/functions";

import {ExpressService} from "../../service/express/ExpressService";

@injectable()
export class InternalsRouter implements Router {

    @inject(DIKey.EXPRESS_SERVICE)
    @tagged(DITag.SERVICE_FETCH_ALL, true)
    private fetchAll: ExpressService;

    @inject(DIKey.EXPRESS_SERVICE)
    @tagged(DITag.SERVICE_ADD_CREDENTIAL, true)
    private addCredential: ExpressService;

    @inject(DIKey.EXPRESS_SERVICE)
    @tagged(DITag.SERVICE_UPDATE_CREDENTIAL, true)
    private updateCredential: ExpressService;

    public bound(handler: Handler): void {
        const express = handler.requestHandler() as Application;

        express.post(
            `${envx("API_INTERNAL_EP")}/addCredential`,
            (req, res, next) => this.addCredential.reply(req, res));

        express.get(
            `${envx("API_INTERNAL_EP")}/fetch/:repository`,
            (req, res, next) => this.fetchAll.reply(req, res));

        express.post(
            `${envx("API_INTERNAL_EP")}/updateCredential`,
            (req, res, next) => this.updateCredential.reply(req, res));
    }
}
