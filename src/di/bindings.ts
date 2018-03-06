import {ContainerModule} from "inversify";
import {Connection} from "typeorm";

import {DIKey, DITag} from "./symbols";

import {Orm} from "../data/repository/Orm";
import {Repository} from "../data/repository/Repository";

import {Handler} from "../handler/Handler";
import {ExpressHandler} from "../handler/ExpressHandler";

import {hasValue} from "../helper/functions";
import {logger} from "../helper/logger";

import {Router} from "../routing/Router";

import {AuthRouter} from "../routing/express/AuthRouter";
import {InternalsRouter} from "../routing/express/InternalsRouter";
import {LoginRouter} from "../routing/express/LoginRouter";
import {MailRouter} from "../routing/express/MailRouter";

import {ExpressService} from "../service/express/ExpressService";
import {AddCredential} from "../service/express/AddCredential";
import {Authorize} from "../service/express/Authorize";
import {FetchAll} from "../service/express/FetchAll";
import {IsAuthorized} from "../service/express/IsAuthorized";
import {Logout} from "../service/express/Logout";
import {MailConfirmationService} from "../service/express/MailConfirmation";
import {MailVerificationService} from "../service/express/MailVerification";
import {SendOnAuthService} from "../service/express/SendOnAuth";
import {UpdateCredential} from "../service/express/UpdateCredential";

const bindings = (connection?: Connection) => new ContainerModule(bind => {

    if (hasValue(connection)) {
        bind<Connection>(DIKey.ORM_CONNECTION).toConstantValue(connection);
    }

    bind<Repository>(DIKey.REPOSITORY).to(Orm).inSingletonScope();

    bind<Handler>(DIKey.HANDLER).to(ExpressHandler).inSingletonScope();

    bind<Router>(DIKey.ROUTER).to(AuthRouter).whenTargetTagged(DITag.EXPRESS_ROUTER, true);
    bind<Router>(DIKey.ROUTER).to(InternalsRouter).whenTargetTagged(DITag.EXPRESS_ROUTER, true);
    bind<Router>(DIKey.ROUTER).to(LoginRouter).whenTargetTagged(DITag.EXPRESS_ROUTER, true);
    bind<Router>(DIKey.ROUTER).to(MailRouter).whenTargetTagged(DITag.EXPRESS_ROUTER, true);

    bind<ExpressService>(DIKey.EXPRESS_SERVICE)
        .to(AddCredential)
        .whenTargetTagged(DITag.SERVICE_ADD_CREDENTIAL, true);

    bind<ExpressService>(DIKey.EXPRESS_SERVICE)
        .to(Authorize)
        .whenTargetTagged(DITag.SERVICE_AUTHORIZE, true);

    bind<ExpressService>(DIKey.EXPRESS_SERVICE)
        .to(FetchAll)
        .whenTargetTagged(DITag.SERVICE_FETCH_ALL, true);

    bind<ExpressService>(DIKey.EXPRESS_SERVICE)
        .to(IsAuthorized)
        .whenTargetTagged(DITag.SERVICE_IS_AUTHORIZED, true);

    bind<ExpressService>(DIKey.EXPRESS_SERVICE)
        .to(Logout)
        .whenTargetTagged(DITag.SERVICE_LOGOUT, true);

    bind<ExpressService>(DIKey.EXPRESS_SERVICE)
        .to(MailConfirmationService)
        .whenTargetTagged(DITag.SERVICE_MAIL_CONFIRMATION, true);

    bind<ExpressService>(DIKey.EXPRESS_SERVICE)
        .to(MailVerificationService)
        .whenTargetTagged(DITag.SERVICE_MAIL_VERIFICATION, true);

    bind<ExpressService>(DIKey.EXPRESS_SERVICE)
        .to(SendOnAuthService)
        .whenTargetTagged(DITag.SERVICE_SEND_ON_AUTH, true);

    bind<ExpressService>(DIKey.EXPRESS_SERVICE)
        .to(UpdateCredential)
        .whenTargetTagged(DITag.SERVICE_UPDATE_CREDENTIAL, true);
});

export {
    bindings
};
