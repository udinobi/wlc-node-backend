import {BaseEntity, Column, Entity, Index, OneToMany, PrimaryGeneratedColumn} from "typeorm";

import {Access} from "./Access";

import {hasValue} from "../../helper/functions";
import {Maybe} from "../../helper/maybe";

import {Access as AccessModel} from "../model/Access";
import {Credential as CredentialModel} from "../model/Credential";

@Entity("credentials")
export class Credential extends BaseEntity {

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
    @Index({ unique: true })
    public username: string;

    @Column({
        nullable : false,
        type : "text"
    })
    public password: string;

    @Column({
        name : "expire_at",
        nullable : false,
        type : "bigint"
    })
    public expireAt: number;

    @Column({
        nullable : false,
        type : "text"
    })
    public resource: string;

    @OneToMany(type => Access, access => access.credential)
    public accesses: Access[];

    public static fromEntity(entity: Credential|undefined): Maybe<CredentialModel> {
        return Maybe.from(entity)
            .map(_ => {
                const model = new CredentialModel(
                    _.username, _.password, _.expireAt,
                    _.resource, _.createdAt, _.id);

                if (hasValue(_.accesses)) {
                    _.accesses.forEach(access => model.accesses.push(Access.fromEntity(access).get()));
                }

                return model;
            });
    }

    public static fromModel(model: CredentialModel|undefined): Maybe<Credential> {
        return Maybe.from(model)
            .map(_ => {
                const entity = new Credential();

                entity.accesses = [];
                if (hasValue(_.accesses)) {
                    _.accesses.forEach(access => entity.accesses.push(Access.fromModel(access).get()));
                }

                entity.createdAt = _.createdAt;
                entity.expireAt = _.expireAt;
                entity.id = _.id;
                entity.password = _.password;
                entity.resource = _.resource;
                entity.username = _.username;
                return entity;
            });
    }
}
