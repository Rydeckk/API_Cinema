import Joi from "joi"

/**
 * @swagger
 * definitions:
 *   CreateRoleRequest:
 *     type: object
 *     properties:
 *       name:
 *         type: string
 *         minLength: 3
 *         description: Le nom du rôle.
 *         example: "Nom du rôle"
 *         required: true
 *       isAdmin:
 *         type: boolean
 *         description: Indique si le rôle est un rôle administrateur.
 *         example: true
 *         required: true
 */

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

/**
 * @swagger
 * definitions:
 *   UpdateRoleRequest:
 *     type: object
 *     properties:
 *       id:
 *         type: integer
 *         format: int64
 *         description: L'ID du rôle à mettre à jour.
 *         example: 123
 *       name:
 *         type: string
 *         minLength: 3
 *         description: Le nouveau nom du rôle.
 *         example: "Nouveau nom du rôle"
 *       isAdmin:
 *         type: boolean
 *         description: Indique si le rôle doit être modifié en tant qu'administrateur.
 *         example: true
 */

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