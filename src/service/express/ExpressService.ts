import {NextFunction, Request, Response} from "express";

export interface ExpressService {
    reply(req: Request, res: Response, next?: NextFunction): any;
}
