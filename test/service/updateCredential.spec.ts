import "reflect-metadata";

import "../../src/config";

import {setup} from "../setup";

import * as request from "supertest";
import * as tape from "tape";
import {It, Mock} from "typemoq";
import { v4 as uuid } from  "uuid";

import {Credential} from "../../src/data/model/Credential";

import {Repository} from "../../src/data/repository/Repository";

import {DIKey, DITag} from "../../src/di/symbols";

import {Handler} from "../../src/handler/Handler";

import {envx} from "../../src/helper/functions";

tape(`Testing route(${DITag.SERVICE_ADD_CREDENTIAL.toString()})`, test => {
    const injector = setup();

    const body = {
        resource: "new-resource",
        username: "username",
        validFor: 3600
    };

    const credential = new Credential(body.username, "password", 0, "old-resource");
    credential.id = uuid();

    const repository = Mock.ofType<Repository>();
    repository.setup(r => r.findOne<Credential>("Credential", { username : body.username }))
        .returns(() => Promise.resolve(credential));

    repository.setup(r => r.save<Credential>("Credential", It.is((c: Credential) =>
        c.expireAt > credential.expireAt &&
        c.resource === body.resource &&
        c.username === body.username
    )))
        .returns((_, c) => Promise.resolve(c));

    injector.rebind<Repository>(DIKey.REPOSITORY).toConstantValue(repository.target);

    request(injector.get<Handler>(DIKey.HANDLER).requestHandler())
        .post(`${envx("API_INTERNAL_EP")}/updateCredential`)
        .send(body)
        .set("Accept", "application/json")
        .set("Content-Type", "application/json")
        .expect("Content-Type", /json/)
        .expect(200)
        .end((err, res) => {
            test.error(err, "No error");

            test.same(res.status, 200);
            test.same(res.body.message, `Credential(${credential.id}) updated`);

            test.end();
        });
});
