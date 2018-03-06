import * as mailer from "nodemailer";

// Need allowSyntheticDefaultImports set to true in tsconfig.json
// TODO: investigate if the import can be removed... it should be already included in nodemailer.
import smtp from "nodemailer-smtp-transport";

import {EMail} from "mailTypes";

import {env} from "../../helper/functions";
import {logger} from "../../helper/logger";

export function sendEmail(email: EMail, onSuccess: () => void, onError: () => void) {
    const transporter = mailer.createTransport({
        auth : {
            pass : env("NO_REPLY_PASSWORD"),
            user : env("NO_REPLY_EMAIL")
        },
        host : env("SMTP_SERVER"),
        port : parseInt(env("SMTP_PORT"), 10),
        requireTLS : true,
        secure : false
    });

    const logData = JSON.stringify({
        from : email.from,
        subject : email.subject,
        to : email.to
    });

    transporter.sendMail(email, (error, info) => {
        if (error) {
            const text = `Error while sending email (${logData})\n${error.message}`;
            logger().error(text);
            onError();
        } else {
            const text = `Sent email (${logData})\n${info.response}`;
            logger().info(text);
            onSuccess();
        }

        transporter.close();
    });
}
