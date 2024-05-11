import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Compte } from "./compte";

@Entity({name: "Transaction"})
export class CompteTransaction {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    montant: number

    @Column()
    type: string

    @CreateDateColumn({type: "datetime"})
    createdAt: Date

    @ManyToOne(() => Compte, compte => compte.id)
    compte: Compte

    constructor(id: number, montant: number, type: string, createdAt: Date, compte: Compte) {
        this.id = id,
        this.montant = montant,
        this.type = type,
        this.createdAt = createdAt,
        this.compte = compte
    }
}