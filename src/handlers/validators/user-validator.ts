import Joi from "joi";

/**
 * @swagger
 * definitions:
 *   CreateUserRequest:
 *     type: object
 *     properties:
 *       email:
 *         type: string
 *         format: email
 *         example: user@example.com
 *         required: true
 *       password:
 *         type: string
 *         format: password
 *         example: password123
 *         required: true
 */

export const createUserValidation = Joi.object<CreateUserValidationRequest>({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
}).options({ abortEarly: false });

export interface CreateUserValidationRequest {
    email: string,
    password: string,
}

/**
 * @swagger
 * definitions:
 *   LoginUserRequest:
 *     type: object
 *     properties:
 *       email:
 *         type: string
 *         format: email
 *         example: user@example.com
 *         required: true
 *       password:
 *         type: string
 *         format: password
 *         example: password123
 *         required: true
 */

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