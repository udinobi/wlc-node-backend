import {Container} from "inversify";

import {bindings} from "../src/di/bindings";

export function setup(): Container {
    const injector = new Container();
    injector.load(bindings());
    return injector;
}
