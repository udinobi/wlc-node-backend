export class Message {

    constructor(
        public username: string,
        public email: string,
        public text: string,
        public verified: boolean,
        public createdAt: number = Date.now(),
        public id?: string
    ) {}
}
