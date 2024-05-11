import Joi from "joi";

export const createUserValidation = Joi.object<CreateUserValidationRequest>({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
}).options({ abortEarly: false });

export interface CreateUserValidationRequest {
    email: string,
    password: string,
}

export const LoginUserValidation = Joi.object<LoginUserValidationRequest>({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
}).options({ abortEarly: false });

export interface LoginUserValidationRequest {
    email: string
    password: string
}

export interface GetUsersRequest {
    page?: number
    limit?: number,
    isAdmin?: boolean
}

export const getUsersValidation = Joi.object<GetUsersRequest>({
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).optional(),
    isAdmin: Joi.bool().optional()
})

export interface GetUserByIdRequest {
    id: number  
}

export const getUserByIdValidation = Joi.object<GetUserByIdRequest>({
    id: Joi.number().required()
})