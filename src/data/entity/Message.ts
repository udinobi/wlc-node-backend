import {BaseEntity, Column, Entity, Index, PrimaryGeneratedColumn} from "typeorm";

import {Message as MessageModel} from "../model/Message";

import {Maybe} from "../../helper/maybe";

@Entity("messages")
@Index("CreatedAt", ["createdAt", "verified"])
export class Message extends BaseEntity {

    @PrimaryGeneratedColumn("uuid")
    public id: string;

    @Column({
        name : "created_at",
        nullable : false,
        type : "bigint"
    })
    public createdAt: number;

    @Column({
        nullable : false,
        type : "text"
    })
    public username: string;

    @Column({
        nullable : false,
        type : "text"
    })
    @Index()
    public email: string;

    @Column({
        name : "message",
        nullable : false,
        type : "text"
    })
    public text: string;

    @Column()
    public verified: boolean;

    public static fromEntity(entity: Message|undefined): Maybe<MessageModel> {
        return Maybe.from(entity)
            .map(_ => new MessageModel(
                _.username, _.email, _.text,
                _.verified, _.createdAt, _.id
            ));
        }

    public static fromModel(model: MessageModel|undefined): Maybe<Message> {
        return Maybe.from(model)
            .map(_ => {
                const entity = new Message();
                entity.createdAt = _.createdAt;
                entity.email = _.email;
                entity.id = _.id;
                entity.text = _.text;
                entity.username = _.username;
                entity.verified = _.verified;
                return entity;
            });
    }
}
