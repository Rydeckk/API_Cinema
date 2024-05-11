import { DataSource } from "typeorm";
import { Billet } from "../database/entities/billet";

export interface ListBilletFilter {
    limit: number,
    page: number,
    type?: number
}

export class BilletUseCase {
    constructor(private readonly db: DataSource) { }

    async getListBillet(id: number,listBilletFilter: ListBilletFilter): Promise<{ billets: Billet[]; }> {
        const query = this.db.createQueryBuilder(Billet, 'billet')
        query.innerJoin('billet.user','user')
        query.where('user.id= :userId',{userId: id})
        query.skip((listBilletFilter.page - 1) * listBilletFilter.limit)
        query.take(listBilletFilter.limit)

        if(listBilletFilter.type !== undefined) {
            query.andWhere("billet.type = :type", {type: listBilletFilter.type})
        }

        const billets = await query.getMany()
        return {
            billets
        }
    }

    async getBilletUser(id: number, userId?: number): Promise<Billet | null> {
        const query = this.db.createQueryBuilder(Billet, 'billet')
        query.innerJoin('billet.user','user')
        query.leftJoinAndSelect('billet.seances','seance')
        query.where('billet.id= :billetId',{billetId: id})
        if(userId) {
            query.andWhere('user.id= :userId', {userId: userId})
        }
        const billetFound = await query.getOne()
        if(billetFound === null) return null

        return billetFound
    }

}