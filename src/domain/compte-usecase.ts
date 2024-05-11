import { DataSource } from "typeorm";
import { Compte } from "../database/entities/compte";

export interface UpdateCompteParams {
    montant: number,
    type: string
}

export class CompteUseCase {
    constructor(private readonly db: DataSource) { }

    async getCompte(id: number, userId: number): Promise<Compte | null> {
        const query = this.db.createQueryBuilder(Compte, 'compte')
        query.innerJoin('compte.users','user')
        query.where('compte.id= :compteId',{compteId: id})
        query.andWhere('user.id= :userId',{userId: userId})
        const compteFound = await query.getOne()
        if (compteFound === null) return null

        return compteFound
    }

    async updateCompte(id: number, compteParam: UpdateCompteParams,userId: number ): Promise<Compte | null> {
        const query = this.db.createQueryBuilder(Compte, 'compte')
        query.innerJoin('compte.users','user')
        query.where('compte.id= :compteId',{compteId: id})
        query.andWhere('user.id= :userId',{userId: userId})
        const compteFound = await query.getOne()
        if (compteFound === null) return null

        if(compteParam.type === "depot") {
            compteFound.solde += compteParam.montant
        } else if (compteParam.type === "retrait") {
            compteFound.solde -= compteParam.montant
        }
        
        const repo = this.db.getRepository(Compte)
        const compteUpdate = await repo.save(compteFound)
        return compteUpdate
    }
}