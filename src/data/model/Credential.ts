import {Access} from "./Access";

export class Credential {

    public accesses: Access[] = [];

    constructor(
        public username: string,
        public password: string,
        public expireAt: number,
        public resource: string,
        public createdAt: number = Date.now(),
        public id?: string
    ) {}
}
