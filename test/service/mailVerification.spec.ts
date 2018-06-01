import "reflect-metadata";

import "../../src/config";

import {setup} from "../setup";

import * as request from "supertest";
import * as tape from "tape";
import {It, Mock} from "typemoq";
import { v4 as uuid } from  "uuid";

import {Message} from "../../src/data/model/Message";

import {Repository} from "../../src/data/repository/Repository";

import {DIKey, DITag} from "../../src/di/symbols";

import {Handler} from "../../src/handler/Handler";

import {env, envx} from "../../src/helper/functions";

const testId = DITag.SERVICE_MAIL_VERIFICATION.toString();

tape(`Testing route(${testId} - unknown contact)`, test => {
    const injector = setup();

    const body = {
        email: "devel@wlc.com",
        message: testId,
        username: env("USER")
    };

    const repository = Mock.ofType<Repository>();
    repository.setup(r => r.findOne<Message>("Message", { email : body.email }))
        .returns(() => Promise.resolve(undefined));

    repository.setup(r => r.save<Message>("Message", It.is((m: Message) =>
        m.email === body.email &&
        m.text === body.message &&
        m.username === body.username
    )))
        .returns((_, m) => {
            m.id = uuid();
            return Promise.resolve(m);
        });

    injector.rebind<Repository>(DIKey.REPOSITORY).toConstantValue(repository.target);

    request(injector.get<Handler>(DIKey.HANDLER).requestHandler())
        .post(`${envx("API_PROXY_EP")}/email/verify`)
        .set("Accept", "application/json")
        .set("X-Requested-With", "XMLHttpRequest")
        .send(body)
        .expect("Content-Type", /json/)
        .expect(200)
        .end((err, res) => {
            test.error(err, "No error");

            test.same(res.status, 200);
            test.same(res.body.message, "waiting-verification");

            test.end();
        });
});

tape(`Testing route(${testId} - known contact)`, test => {
    const injector = setup();

    const body = {
        email: "devel@wlc.com",
        message: testId,
        username: env("USER")
    };

    const message = new Message(body.username, body.email, body.message, true);
    message.id = uuid();

    const repository = Mock.ofType<Repository>();
    repository.setup(r => r.findOne<Message>("Message", { email : body.email }))
        .returns(() => Promise.resolve(message));

    repository.setup(r => r.save<Message>("Message", It.is((m: Message) =>
        m.email === message.email &&
        m.verified
    )))
        .returns((_, m) => {
            m.id = uuid();
            return Promise.resolve(m);
        });

    injector.rebind<Repository>(DIKey.REPOSITORY).toConstantValue(repository.target);

    request(injector.get<Handler>(DIKey.HANDLER).requestHandler())
        .post(`${envx("API_PROXY_EP")}/email/verify`)
        .set("Accept", "application/json")
        .send(body)
        .expect("Content-Type", /json/)
        .expect(200)
        .end((err, res) => {
            test.error(err, "No error");

            test.same(res.body.status, 200);
            test.same(res.body.message, "email-sent");

            test.end();
        });
});
