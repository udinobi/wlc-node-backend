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
        password: "password",
        resource: "resource",
        username: "username",
        validFor: 60  // minutes
    };

    const credential = new Credential(
        body.username, body.password, body.validFor * 1000 * 60, body.resource
    );

    credential.id = uuid();

    const repository = Mock.ofType<Repository>();
    repository.setup(r => r.save<Credential>("Credential", It.is((c: Credential) =>
        c.password === body.password &&
        c.resource === body.resource &&
        c.username === body.username
    )))
        .returns(() => Promise.resolve(credential));

    injector.rebind<Repository>(DIKey.REPOSITORY).toConstantValue(repository.target);

    request(injector.get<Handler>(DIKey.HANDLER).requestHandler())
        .post(`${envx("API_INTERNAL_EP")}/addCredential`)
        .send(body)
        .set("Accept", "application/json")
        .set("Content-Type", "application/json")
        .expect("Content-Type", /json/)
        .expect(200)
        .end((err, res) => {
            test.error(err, "No error");

            test.same(res.body.id, credential.id);

            test.end();
        });
});
