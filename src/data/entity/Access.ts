import {BaseEntity, Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn} from "typeorm";

import {Credential} from "./Credential";

import {Access as AccessModel, AccessOutcome} from "../model/Access";
import {Credential as CredentialModel} from "../model/Credential";

import {Maybe} from "../../helper/maybe";

@Entity("accesses")
export class Access extends BaseEntity {

    @PrimaryGeneratedColumn()
    public id: number;

    @Column({
        name : "created_at",
        nullable : false,
        type : "bigint"
    })
    @Index()
    public createdAt: number;

    @ManyToOne(type => Credential, credential => credential.accesses)
    public credential: Credential;

    @Column({
        nullable : false,
        type : "int"
    })
    @Index()
    public outcome: AccessOutcome;

    @Column({
        nullable : true,
        type : "text"
    })
    // List of client request's IP Addresses
    public clientIPs: string;

    @Column({
        nullable : true,
        type : "text"
    })
    // client request's "user-agent" header
    public agent: string;

    public static fromEntity(entity: Access|undefined): Maybe<AccessModel> {
        return Maybe.from(entity)
            .map(_ => new AccessModel(
                Credential.fromEntity(_.credential).get(), _.outcome,
                _.clientIPs, _.agent, _.createdAt, _.id
            ));
    }

    public static fromModel(model: AccessModel|undefined): Maybe<Access> {
        return Maybe.from(model)
            .map(_ => {
                const entity = new Access();
                entity.agent = _.agent;
                entity.clientIPs = _.clientIPs;
                entity.createdAt = _.createdAt;
                entity.credential = Credential.fromModel(_.credential).get();
                entity.id = _.id;
                entity.outcome = _.outcome;
                return entity;
            });
    }
}
