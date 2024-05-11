import Joi from "joi"

export interface createRoleRequest {
    name: string,
    isAdmin: boolean
}

export const createRoleValidation = Joi.object<createRoleRequest>({
    name: Joi.string()
        .min(3)
        .required(),
    isAdmin: Joi.bool()
        .required()
})

export interface GetRoleByIdRequest {
    id: number
}

export const getRoleByIdValidation = Joi.object<GetRoleByIdRequest>({
    id: Joi.number().required()
})

export interface GetRolesRequest {
    page?: number,
    limit?: number,
    isAdmin?: boolean,
}

export const getRolesValidation = Joi.object<GetRolesRequest>({
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).optional(),
    isAdmin: Joi.bool().optional()
})

export interface UpdateRoleRequest {
    id: number,
    name?: string,
    isAdmin?: boolean
}

export const updateRoleValidation = Joi.object<UpdateRoleRequest>({
    id: Joi.number()
        .required(),
    name: Joi.string()
        .min(3)
        .optional(),
    isAdmin: Joi.bool()
        .optional(),
})