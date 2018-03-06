import {Credential} from "./Credential";

export enum AccessOutcome {
    expired,       // credential is expired
    logout,
    successful,
    unauthorized   // passwords do not match
}

export class Access {

    constructor(
        public credential: Credential,
        public outcome: AccessOutcome,
        public clientIPs: string,
        public agent: string,
        public createdAt: number = Date.now(),
        public id?: number
    ) {}
}
