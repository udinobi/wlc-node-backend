import {Container} from "inversify";
import {Response, SuperTest, Test} from "supertest";
import tape from "tape";
import {It, Mock} from "typemoq";
import { v4 as uuid } from  "uuid";

import {Access, AccessOutcome} from "../../src/data/model/Access";
import {Credential} from "../../src/data/model/Credential";

import {Repository} from "../../src/data/repository/Repository";

import {DIKey, DITag} from "../../src/di/symbols";

import {Handler} from "../../src/handler/Handler";

import {envx, hasValue} from "../../src/helper/functions";

export function authorize(
        injector: Container, test: tape.Test, validFor: number,
        testAction: (req: SuperTest<Test>, res: Response, body?: any) => void) {

    const credential = new Credential("username", "password", validFor, "/resource");
    credential.id = uuid();

    const body = {
        lang: "en",
        password: credential.password,
        resource: credential.resource,
        username: credential.username
    };

    const repository = Mock.ofType<Repository>();
    repository.setup(r => r.findOne<Credential>("Credential", { username : body.username }))
        .returns(() => Promise.resolve(credential));

    repository.setup(r => r.save<Access>("Access", It.is((a: Access) =>
        a.credential.username === body.username &&
        a.credential.resource === credential.resource &&
        a.outcome === AccessOutcome.successful
    )))
        .returns((_, a) => Promise.resolve(a));

    injector.rebind<Repository>(DIKey.REPOSITORY).toConstantValue(repository.target);

    const handler = injector.get<Handler>(DIKey.HANDLER).requestHandler();
    const req = require("supertest-session")(handler);
    req.post(`${envx("API_PROXY_EP")}${envx("API_AUTH")}`)
        .send(body)
        .set("Accept", "application/json")
        .set("Content-Type", "application/json")
        .set("X-Requested-With", "XMLHttpRequest")
        .expect("Content-Type", /json/)
        .end((err, res) => {
            test.error(err, "No error");

            console.log(handler);
            testAction(req, res, body);
        });
}
