import "reflect-metadata";

import "../../src/config";

import {setup} from "../setup";

import {Response, SuperTest, Test} from "supertest";
import * as request from "supertest";
import * as tape from "tape";

import {authorize} from "./authorize";

import {DIKey, DITag} from "../../src/di/symbols";

import {Handler} from "../../src/handler/Handler";

import {envx} from "../../src/helper/functions";

tape(`Testing route(${DITag.SERVICE_IS_AUTHORIZED.toString()})`, test => {
    const injector = setup();

    const testAction = (req: SuperTest<Test>, res: Response, body: any) => {
        test.same(res.status, 200);
        test.same(res.body.redirectTo, `/${body.lang}${envx("API_AUTH")}${body.resource}`);

        req.get(`${envx("API_PROXY_EP")}${envx("API_AUTH")}`)
            .send(body)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .set("X-Requested-With", "XMLHttpRequest")
            .expect("Content-Type", /json/)
            .end((err, resp) => {
                test.error(err, "No error");

                test.same(resp.status, 200);
                test.same(resp.body.message, "true");

                test.end();
            });
    };

    authorize(injector, test, 3600 * 1000 * 60, testAction);
});
