import { DataSource } from "typeorm";
import { Role } from "../database/entities/role";

export interface UpdateRoleParams {
    name?: string,
    isAdmin?: boolean
}

export interface ListRoleFilter {
    limit: number,
    page: number,
    isAdmin?: boolean
}

export class RoleUseCase {
    constructor(private readonly db: DataSource) { }

    async getRole(id: number): Promise<Role | null> {
        const repo = this.db.getRepository(Role)
        const roleFound = await repo.findOneBy({ id })
        if (roleFound === null) return null

        return roleFound
    }

    async getListRole(listRoleFilter: ListRoleFilter): Promise<{ roles: Role[]; }> {
        const query = this.db.createQueryBuilder(Role, 'role')
        query.skip((listRoleFilter.page - 1) * listRoleFilter.limit)
        query.take(listRoleFilter.limit)

        if(listRoleFilter.isAdmin !== undefined) {
            query.andWhere("role.isAdmin = :isAdmin", {isAdmin: listRoleFilter.isAdmin})
        }

        const roles = await query.getMany()
        return {
            roles
        }
    }

    async updateRole(id: number, roleParam: UpdateRoleParams): Promise<Role | null> {
        const repo = this.db.getRepository(Role)
        const rolefound = await repo.findOneBy({ id })
        if (rolefound === null) return null

        if (roleParam.name) {
            roleParam.name = roleParam.name
        }

        if(roleParam.isAdmin !== undefined) {
            roleParam.isAdmin = roleParam.isAdmin
        }

        const roleUpdate = await repo.save(rolefound)
        return roleUpdate
    }

    async deleteRole(id: number): Promise<Role | null> {
        const repo = this.db.getRepository(Role)
        const rolefound = await repo.findOneBy({ id })
        if (rolefound === null) return null

        repo.delete({ id })
        return rolefound
    }
}