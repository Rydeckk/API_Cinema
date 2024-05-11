import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne } from "typeorm"
import { Token } from "./token"
import { Role } from "./role"
import { Billet } from "./billet"
import { Compte } from "./compte"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        unique: true
    })
    email: string

    @Column()
    password: string

    @ManyToOne(() => Role, role => role.id)
    role: Role

    @ManyToOne(() => Compte, compte => compte.id)
    compte: Compte

    @CreateDateColumn({type: "datetime"})
    createdAt: Date

    @OneToMany(() => Token, token => token.user, {onDelete: 'CASCADE'})
    tokens: Token[];

    @OneToMany(() => Billet, billet => billet.user, {onDelete: 'CASCADE'})
    billets: Billet[]

    constructor(id: number, email: string, password: string, role: Role, compte: Compte ,createdAt: Date, tokens: Token[], billets: Billet[]) {
        this.id = id,
        this.email = email,
        this.password = password,
        this.role = role,
        this.compte = compte,
        this.createdAt = createdAt,
        this.tokens = tokens,
        this.billets = billets
    }
}