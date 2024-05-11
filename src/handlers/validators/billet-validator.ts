import Joi from "joi"

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