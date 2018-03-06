import {inject, injectable} from "inversify";

import {
    BaseEntity, Connection, ConnectionOptions,
    createConnection, EntityManager, EntityRepository
} from "typeorm";

import {FileLogger} from "typeorm/logger/FileLogger";
import {LoggerOptions} from "typeorm/logger/LoggerOptions";

import {appendFileSync, existsSync, mkdirSync} from "fs";

import {Repository} from "./Repository";

import {DIKey} from "../../di/symbols";

import {env, envx, hasValue, toCurrentTime} from "../../helper/functions";

import {logger, logdir} from "../../helper/logger";

class OrmLogger extends FileLogger {

    private logfile: string;

    constructor(options?: LoggerOptions) {
        super(options);

        this.logfile = `${logdir}/typeorm.log`;
    }

    protected write(strings: string|string[]) {
        const arr = strings instanceof Array ? strings : [strings];
        strings = arr.map(str => "[" + toCurrentTime() + "] " + str);
        appendFileSync(this.logfile, strings.join("\r\n") + "\r\n");
    }
}

const asBoolean = (param: string) => param === "true";

function asArray(param: string): string[] {
    return param.split(",").map(str => str.trim());
}

function connectionOptions(): ConnectionOptions {
    const logging = env("TYPEORM_LOGGING");
    const options = hasValue(logging) ? asArray(logging) : "all";

    let _logger;
    if (env("NODE_ENV") !== "prod") {
        _logger = "advanced-console";
    } else {
        if (!existsSync(logdir)) mkdirSync(logdir);
        _logger = new OrmLogger(options as LoggerOptions);
    }

    return {
        database: envx("TYPEORM_DATABASE"),
        entities: asArray(`${process.cwd()}/${envx("TYPEORM_ENTITIES")}`),
        host: envx("TYPEORM_HOST"),
        logger: _logger,
        logging: options as LoggerOptions,
        password: envx("TYPEORM_PASSWORD"),
        port: envx("TYPEORM_PORT"),
        synchronize: asBoolean(env("TYPEORM_SYNCHRONIZE")),
        type: envx("TYPEORM_CONNECTION") as any,
        username: envx("TYPEORM_USERNAME")
    };
}

export function getConnection(): Promise<Connection> {
    return createConnection(connectionOptions())
        .catch(error => {
            const text = `Error while connecting to the DB\n${error}`;
            logger().error(text);
            throw error;
        });
}

@injectable()
@EntityRepository()
export class Orm<T extends BaseEntity> implements Repository {

    private manager: EntityManager;

    constructor(@inject(DIKey.ORM_CONNECTION) private connection: Connection) {
        this.manager = connection.manager;
    }

    /* tslint:disable:no-shadowed-variable */

    public fetchAll<T>(repository: string): Promise<T[]> {
        return this.manager.find(repository);
    }

    public findOne<T>(repository: string, condition: Partial<T>): Promise<T | undefined> {
        return this.manager.findOne(repository, condition);
    }

    public save<T>(repository: string, entity: T): Promise<T> {
        return this.manager.save(entity);
    }
}
