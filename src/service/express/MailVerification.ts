import {Request, Response} from "express";
import {readFileSync} from "fs";
import {inject, injectable} from "inversify";

import {HtmlMail, TextMail} from "mailTypes";

import {ExpressService} from "./ExpressService";
import {illegalRequest} from "./functions";
import {sendEmail} from "./mailer";

import {Message} from "../../data/entity/Message";

import {Message as MessageModel} from "../../data/model/Message";

import {Repository} from "../../data/repository/Repository";

import {DIKey} from "../../di/symbols";

import {envx, hasNoValue, sendResponse} from "../../helper/functions";
import {logger} from "../../helper/logger";
import {Maybe} from "../../helper/maybe";

 // TODO. Add module to support i18n messages.

@injectable()
export class MailVerificationService implements ExpressService {

    private static verifyTemplate =
        readFileSync(`${process.cwd()}/assets/verify-template.html`, "utf8")
            .replace("==email=url=protocol==", envx("EMAIL_URL_PROTOCOL"))
            .replace("==email=url=host==", envx("EMAIL_URL_HOST"))
            // public EP proxied by Apache to API_PROXY_EP
            .replace("==email=url=public=ep==", envx("EMAIL_URL_PUBLIC_EP"))
            .replace("==email=url=path==", envx("EMAIL_URL_PATH"));

    @inject(DIKey.REPOSITORY)
    private repo: Repository;

    public reply(req: Request, res: Response) {
        if (illegalRequest(req)) {
            logger().error("CSRF protection: illegal request(email verify)");
            return;
        }

        const body = req.body;
        const username = body.username;
        const email = body.email;
        const text = body.message;

        if (typeof username !== "string"
        &&  typeof email !== "string"
        &&  typeof text !== "string") {
            logger().error("Illegal request(email verify). Wrong or missing parameters");
            return;
        }

        if (username.length < 3) {
            sendResponse(res, 400, "illegal-name");
        } else if (email.length < 5 || email.includes(" ")) {
            sendResponse(res, 400, "illegal-email");
        } else if (text.length < 10) {
            sendResponse(res, 400, "incomplete-message");
        } else {
            this.repo.findOne<Message>("Message", { email : email })
                .then(message => this.sendVerificationEmail(Message.fromEntity(message), res, username, email, text))
                .catch(error => {
                    const _text = `Error while searching Message by email (${email})\n${error}`;
                    logger().error(_text);
                    // Sadly we have to ask the user to confirm the email identity again.
                    this.sendVerificationEmail(undefined, res, username, email, _text);
                });
        }
    }

    private sendEmailFromKnownContact(res: Response, username: string, email: string, text: string) {
        const subject = `Info request from ${username} (Known Contact)`;

        const _email: TextMail = {
            from : email,
            subject : subject,
            text : `${subject}\n${"=".repeat(80)}\n\n${text}`,
            to : "info@wlc.com"
        };

        // Persist the message... even when the email won't be succesfully sent.
        this.repo.save<Message>("Message", Message.fromModel(new MessageModel(username, email, text, true)).get())
            .catch(error => {
                const _text = `Error while persisting new Message(${username}, ${email}) from known contact\n${error}`;
                logger().error(_text);
            });

        const onError = () => sendResponse(res, 400, "email-not-sent");

        const onSuccess = () => sendResponse(res, 200, "email-sent");

        sendEmail(_email, onSuccess, onError);
    }

    private sendVerificationEmail(message: Maybe<MessageModel>, res: Response, username: string, email: string, text: string) {
        message.ifOrElse(_ => {
            // Contact is known.
            if (_.verified) {
                // No need to send the verification email.
                // Sending new message from contact directly to info@.
                this.sendEmailFromKnownContact(res, username, email, text);
                return;
            }

            // We are still waiting that the contact would confirm the first message!!
            // Doing nothing in the meanwhile... do not want another pending message in the DB.
            logger().warn(`Email from ${email} rejected. Initial verification is still pending`);
            sendResponse(res, 400, "verification-pending");
        },
        () => {
            const onError = () => sendResponse(res, 400, "email-not-sent");

            const onSuccess = () => sendResponse(res, 200, "waiting-verification");

            // Saving the message as pending (unverified).
            // Message, after being persisted, is not removed in case the email is not successfully
            // sent, as it will be in any case removed via DB trigger the day after.
            this.repo.save<Message>("Message", Message.fromModel(new MessageModel(username, email, text, false)).get())
                .then(_message => {
                    const _email: HtmlMail = {
                        from : "info@wlc.com",
                        html : MailVerificationService.verifyTemplate
                            .replace("==email=username==", username)
                            .replace("==email=url=uuid==", _message.id),
                        subject : "WLC Email Confirmation Required",
                        to : email
                    };

                    sendEmail(_email, onSuccess, onError);
                })
                .catch(error => {
                    const _text = `Error while persisting new Message(${username}, ${email}) from unknown contact\n${error}`;
                    logger().error(_text);
                    onError();
                });
        });
    }
}
