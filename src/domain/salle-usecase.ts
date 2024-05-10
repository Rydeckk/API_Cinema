import { DataSource } from "typeorm";
import { Salle } from "../database/entities/salle";

export interface UpdateSalleParams {
    name?: string,
    description?: string,
    images?: string,
    type?: string,
    capacite?: number,
    accessHandicap?: boolean,
    isMaintenance?: boolean
}

export interface ListSalleFilter {
    limit: number,
    page: number,
    accessHandicap?: boolean,
    isMaintenance?: boolean
}

export class SalleUseCase {
    constructor(private readonly db: DataSource) { }

    async getSalle(id: number): Promise<Salle | null> {
        const repo = this.db.getRepository(Salle)
        const salleFound = await repo.findOneBy({ id })
        if (salleFound === null) return null

        return salleFound
    }

    async getListSalle(listSalleFilter: ListSalleFilter): Promise<{ salles: Salle[]; }> {
        const query = this.db.createQueryBuilder(Salle, 'salle')
        query.skip((listSalleFilter.page - 1) * listSalleFilter.limit)
        query.take(listSalleFilter.limit)

        if(listSalleFilter.accessHandicap !== undefined) {
            query.andWhere("salle.accessHandicap = :accessHandicap", {accessHandicap: listSalleFilter.accessHandicap})
        }

        if(listSalleFilter.isMaintenance !== undefined) {
            query.andWhere("salle.isMaintenance = :isMaintenance", {isMaintenance: listSalleFilter.isMaintenance})
        }

        const salles = await query.getMany()
        return {
            salles
        }
    }

    async updateSalle(id: number, salleParam: UpdateSalleParams): Promise<Salle | null> {
        const repo = this.db.getRepository(Salle)
        const sallefound = await repo.findOneBy({ id })
        if (sallefound === null) return null

        if (salleParam.name) {
            sallefound.name = salleParam.name
        }

        if(salleParam.description) {
            sallefound.description = salleParam.description
        }

        if(salleParam.images) {
            sallefound.images = salleParam.images
        }

        if(salleParam.type) {
            sallefound.type = salleParam.type
        }

        if(salleParam.capacite) {
            sallefound.capacite = salleParam.capacite
        }

        if(salleParam.accessHandicap !== undefined) {
            sallefound.accessHandicap = salleParam.accessHandicap
        }

        if(salleParam.isMaintenance !== undefined) {
            sallefound.isMaintenance = salleParam.isMaintenance
        }

        const salleUpdate = await repo.save(sallefound)
        return salleUpdate
    }

    async deleteSalle(id: number): Promise<Salle | null> {
        const repo = this.db.getRepository(Salle)
        const sallefound = await repo.findOneBy({ id })
        if (sallefound === null) return null

        repo.delete({ id })
        return sallefound
    }

}