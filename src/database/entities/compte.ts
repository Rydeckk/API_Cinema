import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user";
import { CompteTransaction } from "./transaction";

@Entity({name: "Compte"})
export class Compte {
    @PrimaryGeneratedColumn()
    id: number

    @Column({default: 0})
    solde: number

    @OneToMany(() => User, user => user.compte)
    users: User[]

    @OneToMany(() => CompteTransaction, transaction => transaction.compte)
    transactions: CompteTransaction[]

    constructor(id: number, solde: number, users: User[], transactions: CompteTransaction[]) {
        this.id = id,
        this.solde = solde,
        this.users = users,
        this.transactions = transactions
    }
}