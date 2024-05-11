import { DataSource } from "typeorm";
import { User } from "../database/entities/user";
import { Token } from "../database/entities/token";

export interface ListUserFilter {
    page: number,
    limit: number,
    isAdmin?: boolean
}

export class UserUseCase {
    constructor(private readonly db: DataSource) { }

    async getListUser(listUserFilter: ListUserFilter): Promise<{ users: User[]; }> {
        const query = this.db.createQueryBuilder(User, 'user')
        query.skip((listUserFilter.page - 1) * listUserFilter.limit)
        query.take(listUserFilter.limit)
        query.innerJoinAndSelect('user.role','role')

        if(listUserFilter.isAdmin !== undefined) {
            query.andWhere('role.isAdmin= isAdmin', {isAdmin: listUserFilter.isAdmin})
        }

        const users = await query.getMany()
        return {
            users
        }
    }

    async getUser(id: number): Promise<User | null> {
        const repo = this.db.getRepository(User)
        const userFound = repo.findOneBy({id})
        if (!userFound) return null

        return userFound
    }

    async getUserByToken(token: string): Promise<User | null> {
        const queryToken = this.db.createQueryBuilder(Token, 'token')
        queryToken.innerJoinAndSelect('token.user','user')
        queryToken.where('token.token= token',{token: token})
        const tokenFound = await queryToken.getOne()

        if(!tokenFound) {
            return null
        }

        const queryUser = this.db.createQueryBuilder(User, 'user')
        queryUser.innerJoinAndSelect('user.compte','compte')
        queryUser.innerJoinAndSelect('user.role','role')
        queryUser.where('user.id= :userId',{userId: tokenFound.user.id})

        const user = await queryUser.getOne()

        if (!user) {
            return null
        }

        return user
    }
}