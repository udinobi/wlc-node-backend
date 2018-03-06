
import {Handler} from "../handler/Handler";

export interface Router {
    bound(handler: Handler): void;
}
