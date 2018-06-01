import {Request, Response} from "express";
import {readFileSync} from "fs";
import {inject, injectable} from "inversify";

import {TextMail} from "mailTypes";

import {ExpressService} from "./ExpressService";
import {sendEmail} from "./mailer";

import {Message} from "../../data/entity/Message";

import {Message as MessageModel} from "../../data/model/Message";

import {Repository} from "../../data/repository/Repository";

import {DIKey} from "../../di/symbols";

import {sendHtml, sendResponse} from "../../helper/functions";
import {logger} from "../../helper/logger";
import {Maybe} from "../../helper/maybe";

 // TODO. Add module to support i18n messages.
const alreadyForwarded = `<p>Your identity was already confirmed, ==username==. And your message was already forwarded.</p>
    <p>If you need urgently to receive information, you can also contact us at
    <span class="strong">+66 623 906 000</span>&nbsp;&nbsp;(Mon-Fri, 9:00-18:00)</p>`;

const emailNotSent = `<p>We are really sorry, ==username==. Due to technical reasons, we cannot forward your message.</p>
    <p>Would you be so kind and try later ?</p>
    <p>Alternatively, you can also contact us at <span class="strong">+66 623 906 000</span>&nbsp;&nbsp;(Mon-Fri, 9:00-18:00)</p>`;

const emailSent = `<p>Great!! Your message was successfully forwarded.</p><p>Thanks for getting in touch, ==username==.</p>`;

const removed = `<p>We are really sorry, but your message was removed.</p>
    <p>For security reasons, any unconfirmed Email Address is removed, along with the message, after 24 hours.</p>
    <p>If you want to send us your message again, please confirm your identity within the next 24 hours.<p>
    <p>You can also contact us at <span class="strong">+66 623 906 000</span>&nbsp;&nbsp;(Mon-Fri, 9:00-18:00)</p>
    <p>Thanks for understanding.</p>`;

@injectable()
export class MailConfirmationService implements ExpressService {

    private static responseTemplate =
        readFileSync(`${process.cwd()}/assets/response-template.html`, "utf8");

    @inject(DIKey.REPOSITORY)
    private repo: Repository;

    public reply(req: Request, res: Response) {
        if (!!req.params && typeof req.params.id === "string") {
            const id = String(req.params.id);
            this.repo.findOne<Message>("Message", { id : id })
                .then(message => this.sendEmailFromNewContact(id, Message.fromEntity(message), res))
                .catch(error => {
                    const text = `Error while searching Message by id (${id})\n${error}`;
                    logger().error(text);
                    sendResponse(res, 400, "cannot-confirm");
                });
        }
    }

    private sendEmailFromNewContact(id: string, message: Maybe<MessageModel>, res: Response) {
        message.ifOrElse(_ => {
            if (_.verified) {
                const text = `Message-Id(${id}) reconfirmed by ${_.email}. Message was already forwarded.`;
                logger().warn(text);
                sendHtml(res, MailConfirmationService.responseTemplate
                    .replace("==message==",
                        alreadyForwarded.replace("==username==", _.username)));
                return;git 
            }

            const subject = `Info request from ${_.username} (New Contact)`;

            const email: TextMail = {
                from : _.email,
                subject : subject,
                text : `${subject}\n${"=".repeat(80)}\n\n${_.text}`,
                to : "info@wlc.com"
            };

            // Updating the message as verified... even when the email won't be succesfully sent.
            _.verified = true;
            this.repo.save<Message>("Message", Message.fromModel(_).get())
                .catch(error => {
                    const text = `Error while updating message (${_.id}, ${_.username}, ${_.email})\n${error}`;
                    logger().error(text);
                });

            const onError = () => sendHtml(res,
                MailConfirmationService.responseTemplate.replace(
                    "==message==",
                    emailNotSent.replace("==username==", _.username)
                )
            );

            const onSuccess = () => sendHtml(res,
                MailConfirmationService.responseTemplate.replace(
                    "==message==",
                    emailSent.replace("==username==", _.username)
                )
            );

            sendEmail(email, onSuccess, onError);
        },
        () => {
            const text = `Unknown Message-Id(${id}) at "confirm" endpoint. Unverified Message probably already removed.`;
            logger().warn(text);
            sendHtml(res, MailConfirmationService.responseTemplate.replace("==message==", removed));
        });
    }
}
