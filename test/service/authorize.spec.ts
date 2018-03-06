import "reflect-metadata";

import "../../src/config";

import {setup} from "../setup";

import {Response, SuperTest, Test} from "supertest";
import * as tape from "tape";

import {authorize} from "./authorize";

import {AccessOutcome} from "../../src/data/model/Access";

import {DITag} from "../../src/di/symbols";

import {envx} from "../../src/helper/functions";

tape(`Testing route(${DITag.SERVICE_AUTHORIZE.toString()} - authorized)`, test => {
    const injector = setup();

    const testAction = (req: SuperTest<Test>, res: Response, body: any) => {
        test.same(res.status, 200);
        test.same(res.body.redirectTo, `/${body.lang}${envx("API_AUTH")}${body.resource}`);

        test.end();
    };

    authorize(injector, test, 3600 * 1000 * 60, testAction);
});

tape(`Testing route(${DITag.SERVICE_AUTHORIZE.toString()} - expired)`, test => {
    const injector = setup();

    const testAction = (req: SuperTest<Test>, res: Response) => {
        test.same(res.status, 401);
        test.same(res.body.message, AccessOutcome[AccessOutcome.expired]);

        test.end();
    };

    authorize(injector, test, -1, testAction);
});
