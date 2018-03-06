import {Request, Response} from "express";
import * as fs from "fs";
import {injectable} from "inversify";

import {ExpressService} from "./ExpressService";

import {languages} from "../../helper/functions";
import {logger} from "../../helper/logger";

@injectable()
export class SendOnAuthService implements ExpressService {

    private onError(req: Request, res: Response, file: string, action: string, error: NodeJS.ErrnoException) {
        const text = `Error while ${action} asset (${file})\n${error}`;
        logger().error(text);
        res.redirect(`/${req.session.language}/404.html/`);
    }

    public reply(req: Request, res: Response) {
        if (req.session.authorized === "yes") {
            this.sendFile(req, res, req.originalUrl);
        } else {
            const part = req.originalUrl.split("/", 2);
            const language = languages().has(part[0]) ? part[0] : "en";
            res.redirect(`/${language}/login/`);
        }
    }

    private sendFile(req: Request, res: Response, pathname: string) {
        let file = `${process.cwd()}/assets/${pathname}`;
        fs.stat(file, (error, stat) => {
            if (error) {
                this.onError(req, res, file, "checking", error);
            } else {
                if (stat.isDirectory()) {
                    this.sendIndexFile(req, res, pathname, file);
                } else {
                    this.sendStream(req, res, pathname, file);
                }
            }
        });
    }

    private sendIndexFile(req: Request, res: Response, pathname: string, file: string) {
        if (file.substr(file.length - 1) === "/") {
            this.sendFile(req, res, pathname += "index.html");
        } else {
            res.redirect(pathname + "/index.html");
        }
    }

    private sendStream(req: Request, res: Response, pathname: string, file: string) {
        res.writeHead(200);
        const stream = fs.createReadStream(file);
        stream.on("error", _error => this.onError(req, res, file, "streaming", _error));

        stream.on("end", () =>
        logger().info(`Sent ${pathname} to ${req.ip}. "${req.get("user-agent")}"`));

        stream.pipe(res);
    }
}
