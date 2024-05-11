import { DataSource } from "typeorm";
import { CompteTransaction } from "../database/entities/transaction";

export interface ListTransactionFilter {
    limit: number,
    page: number,
    type?: string
}

export class TransactionUseCase {
    constructor(private readonly db: DataSource) { }

    async getListTransactions(listTransactionFilter: ListTransactionFilter, compteId: number): Promise<{ transactions: CompteTransaction[]; }> {
        const query = this.db.createQueryBuilder(CompteTransaction, 'transaction')
        query.skip((listTransactionFilter.page - 1) * listTransactionFilter.limit)
        query.take(listTransactionFilter.limit)
        query.innerJoin('transaction.compte', 'compte')
        query.where('compte.id= :compteId', {compteId: compteId})

        if(listTransactionFilter.type !== undefined) {
            query.andWhere("transaction.type = :type", {type: listTransactionFilter.type})
        }

        const transactions = await query.getMany()
        return {
            transactions
        }
    }
}