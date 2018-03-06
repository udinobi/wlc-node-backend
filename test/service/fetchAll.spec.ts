import "reflect-metadata";

import "../../src/config";

import {setup} from "../setup";

import * as request from "supertest";
import * as tape from "tape";
import {Mock} from "typemoq";

import {Credential} from "../../src/data/model/Credential";

import {Repository} from "../../src/data/repository/Repository";

import {DIKey, DITag} from "../../src/di/symbols";

import {Handler} from "../../src/handler/Handler";

import {envx} from "../../src/helper/functions";

tape(`Testing route(${DITag.SERVICE_FETCH_ALL.toString()})`, test => {
    const injector = setup();

    const credential = new Credential("username", "password", 0, "resource");

    const expected = {
        expireAt: credential.expireAt,
        password: credential.password,
        resource: credential.resource,
        username: credential.username
    };

    const repository = Mock.ofType<Repository>();
    repository.setup(r => r.fetchAll("Credential"))
        .returns(() => Promise.resolve([ credential, credential ]));

    injector.rebind<Repository>(DIKey.REPOSITORY).toConstantValue(repository.target);

    request(injector.get<Handler>(DIKey.HANDLER).requestHandler())
        .get(`${envx("API_INTERNAL_EP")}/fetch/Credential`)
        .expect("Content-Type", /json/)
        .expect(200)
        .end((err, res) => {
            test.error(err, "No error");

            test.same(res.status, 200);
            test.true(Object.keys(expected).every(k =>
                expected[k] === res.body[0][k] &&
                expected[k] === res.body[1][k])) ;

            test.end();
        });
});
