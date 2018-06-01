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

const testId = DITag.SERVICE_MAIL_CONFIRMATION.toString();

tape(`Testing route(${testId} - unknown contact, probably removed)`, test => {
    const injector = setup();

    const id = uuid();

    const repository = Mock.ofType<Repository>();
    repository.setup(r => r.findOne<Message>("Message", { id : id }))
        .returns(() => Promise.resolve(undefined));

    injector.rebind<Repository>(DIKey.REPOSITORY).toConstantValue(repository.target);

    request(injector.get<Handler>(DIKey.HANDLER).requestHandler())
        .get(`${envx("API_PROXY_EP")}/email/confirm/${id}`)
        .expect("Content-Type", /html/)
        .expect(200)
        .end((err, res) => {
            test.error(err, "No error");

            test.same(res.status, 200);
            test.assert(res.text.includes(
                "We are really sorry, but your message was removed"
            ));

            test.end();
        });
});

tape(`Testing route(${testId} - known contact, message already forwarded)`, test => {
    const injector = setup();

    const message = new Message(env("USER"), "devel@wlc.com", testId, true);
    message.id = uuid();

    const repository = Mock.ofType<Repository>();
    repository.setup(r => r.findOne<Message>("Message", { id : message.id }))
        .returns(() => Promise.resolve(message));

    injector.rebind<Repository>(DIKey.REPOSITORY).toConstantValue(repository.target);

    request(injector.get<Handler>(DIKey.HANDLER).requestHandler())
        .get(`${envx("API_PROXY_EP")}/email/confirm/${message.id}`)
        .expect("Content-Type", /html/)
        .expect(200)
        .end((err, res) => {
            test.error(err, "No error");

            test.same(res.status, 200);
            test.assert(res.text.includes(
                `Your identity was already confirmed, ${message.username}`
            ));

            test.end();
        });
});

tape(`Testing route(${testId} - new contact, identity confirmed)`, test => {
    const injector = setup();

    const message = new Message(env("USER"), "devel@wlc.com", testId, false);
    message.id = uuid();

    const repository = Mock.ofType<Repository>();
    repository.setup(r => r.findOne<Message>("Message", { id : message.id }))
        .returns(() => Promise.resolve(message));

    repository.setup(r => r.save<Message>("Message", It.is((m: Message) =>
        m.id === message.id &&
        m.email === message.email &&
        m.text === message.text &&
        m.username === message.username &&
        m.verified
    )))
        .returns((_, m) => Promise.resolve(m));

    injector.rebind<Repository>(DIKey.REPOSITORY).toConstantValue(repository.target);

    request(injector.get<Handler>(DIKey.HANDLER).requestHandler())
        .get(`${envx("API_PROXY_EP")}/email/confirm/${message.id}`)
        .expect("Content-Type", /html/)
        .expect(200)
        .end((err, res) => {
            test.error(err, "No error");

            test.same(res.status, 200);
            test.assert(res.text.includes(
                `Thanks for getting in touch, ${message.username}`
            ));

            test.end();
        });
});
