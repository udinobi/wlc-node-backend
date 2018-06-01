import {Request, Response} from "express";

import {TextMail} from "mailTypes";

import {sendEmail} from "./mailer";

import {Access} from "../../data/entity/Access";

import {Access as AccessModel, AccessOutcome} from "../../data/model/Access";
import {Credential} from "../../data/model/Credential";

import {Repository} from "../../data/repository/Repository";

import {DIKey} from "../../di/symbols";

import {
    doNothing, env, envx, sendRedirect,
    sendResponse, toCurrentTime, toTime
} from "../../helper/functions";

import {logger} from "../../helper/logger";
import {Maybe} from "../../helper/maybe";

export function illegalRequest(req: Request): boolean {
    // (simple CSRF protection)
    //  We do nothing and not send any response (the client request will be left hanging) if ...
    //     1) the JQuery "X-Requested-With" header is not present and we are in production
    //  or 2) no body is present.
    return !req.xhr && env("NODE_ENV") === "prod" || !req.body;
}

export function isLocalhost(req: Request): boolean {
    return !!req.body
        && (req.headers.host.startsWith("localhost:")
        ||  req.headers.host.startsWith("127.0.0.1:"));
}

function notify(credential: Credential, outcome: AccessOutcome, clientIPs: string) {
    const otc = `WLC Access(${AccessOutcome[outcome]})`;
    const atd = toCurrentTime();
    const exp = outcome === AccessOutcome.expired
        ? `expired at(${toTime(credential.expireAt)})`
        : "";

    const mail: TextMail = {
        from : "devel@wlc.com",
        subject : otc,
        text : `${otc} from IP(${clientIPs}) at(${atd})\n\nCredential(${credential.username}) ${exp}`,
        to : "info@wlc.com"
    };

    sendEmail(mail, doNothing, doNothing);
}

export function registerAccess(
        repo: Repository, credential: Maybe<Credential>, outcome: AccessOutcome,
        clientIPs: string, req: Request, res: Response) {

    if (credential.isEmpty()) return;

    const _ = credential.get();

    const model = new AccessModel(_, outcome, clientIPs, req.get("user-agent"));

    repo.save<Access>("Access", Access.fromModel(model).get())
        .catch(error => {
            const ao = AccessOutcome[outcome];
            const username = _.username;
            const text = `Error while persisting new ${ao} Access(${username}). IP(${clientIPs})\n${error}`;
            logger().error(text);
        });

    switch (outcome) {
        case AccessOutcome.successful :
            req.session.authorized = "yes";
            req.session.credential = _.id;
            req.session.language = req.body.lang;
            req.session.resource = _.resource;
            sendRedirect(res, `/${req.body.lang}${envx("API_AUTH")}${_.resource}`);
            break;

        case AccessOutcome.logout :
            break;

        default :
            sendResponse(res, 401, AccessOutcome[outcome]);
            break;
    }

    notify(_, outcome, clientIPs);
}
