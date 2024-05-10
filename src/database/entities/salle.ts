import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Seance } from "./seance";


@Entity({ name: "Salle" })
export class Salle {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    description: string

    @Column()
    images: string

    @Column()
    type: string

    @Column()
    capacite: number

    @Column({default : false})
    accessHandicap?: boolean

    @Column({default : false})
    isMaintenance?: boolean

    @OneToMany(() => Seance, (seance) => seance.salle, {onDelete: 'CASCADE'}) 
    seances: Seance[]

    constructor(id: number,name: string, description: string, images: string, type: string, capacite: number, accessHandicap: boolean = false, isMaintenance: boolean = false, seances: Seance[]) {
        this.id = id,
        this.name = name,
        this.description = description,
        this.images = images,
        this.type = type,
        this.capacite = capacite,
        this.accessHandicap = accessHandicap,
        this.isMaintenance = isMaintenance,
        this.seances = seances
    }
}