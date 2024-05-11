import Joi from "joi"
/**
 * @swagger
 * definitions:
 *   CreateBilletRequest:
 *     type: object
 *     properties:
 *       name:
 *         type: string
 *         minLength: 3
 *         description: Le nom du billet.
 *         example: "MonSuperBillet"
 *       type:
 *         type: integer
 *         minimum: 1
 *         maximum: 2
 *         description: Le type de billet (optionnel). 1 pour un billet simple, 2 pour un billet VIP.
 *         example: 1
 */
export interface createBilletRequest {
    name: string,
    type?: number
}

export const createBilletValidation = Joi.object<createBilletRequest>({
    name: Joi.string()
        .min(3)
        .required(),
    type: Joi.number()
        .min(1)
        .max(2)
        .optional(),
})

export interface getListBilletRequest {
    page?: number,
    limit?: number,
    type?: number
}

export const getBilletsValidation = Joi.object<getListBilletRequest>({
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).optional(),
    type: Joi.number().min(1).max(2).optional()
})