import express, { Request, Response } from "express"
import { AppDataSource } from "../database/database"
import { compare, hash } from "bcrypt";
import { createUserValidation, LoginUserValidation } from "./validators/user-validator"
import { generateValidationErrorMessage } from "./validators/generate-validation-messages";
import { User } from "../database/entities/user";
import { sign } from "jsonwebtoken";
import { Token } from "../database/entities/token";
import { Role } from "../database/entities/role";
import { authMiddleware } from "./middleware/auth-middleware";
import { Compte } from "../database/entities/compte";

export const UserHandler = (app: express.Express) => {
    /**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Créer un nouveau compte utilisateur.
 *     description: Crée un nouveau compte utilisateur avec les informations fournies.
 *     tags:
 *       - Authentification
 *     requestBody:
 *       description: Données du nouvel utilisateur à créer.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/CreateUserRequest'
 *     responses:
 *       '201':
 *         description: Compte utilisateur créé avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 email:
 *                   type: string
 *                   example: user@example.com
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-05-14T12:30:45.000Z"
 *                 role:
 *                   type: string
 *                   example: Utilisateur
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '404':
 *         description: Aucun rôle disponible.
 *       '500':
 *         description: Erreur interne du serveur.
 */
    app.post('/auth/signup', async (req: Request, res: Response) => {
        try {

            const validationResult = createUserValidation.validate(req.body)
            if (validationResult.error) {
                res.status(400).send(generateValidationErrorMessage(validationResult.error.details))
                return
            }
            const createUserRequest = validationResult.value
            const hashedPassword = await hash(createUserRequest.password, 10);

            const repoRole = AppDataSource.getRepository(Role)
            const roleFound = await repoRole.findOne({where : {isAdmin: false}})
            if (roleFound === null) {
                res.status(404).send({"error": "Aucun role disponible"})
                return
            }

            const repoCompte = AppDataSource.getRepository(Compte)
            const compteCreated = await repoCompte.save({})

            const userRepository = AppDataSource.getRepository(User)
            const user = await userRepository.save({
                email: createUserRequest.email,
                password: hashedPassword,
                role: roleFound,
                compte: compteCreated
            });

            res.status(201).send({ id: user.id, email: user.email, createdAt: user.createdAt, role: user.role.name })
            return
        } catch (error) {
            console.log(error)
            res.status(500).send({ "error": "internal error retry later" })
            return
        }
    })

    /**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authentification de l'utilisateur.
 *     description: Authentifie un utilisateur avec les informations fournies et retourne un jeton d'authentification JWT.
 *     tags:
 *       - Authentification
 *     requestBody:
 *       description: Informations d'identification de l'utilisateur.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/LoginUserRequest'
 *     responses:
 *       '200':
 *         description: Authentification réussie. Retourne un jeton d'authentification JWT.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiZW1haWxAdXNlci5jb20iLCJpYXQiOjE2MjE0NjU4NjksImV4cCI6MTYyMTU1MjI2OX0.4ESeNxP8IOnvm9Dm8ZkQaw4jMN4VhsRsBnj1hJF9MvE
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '500':
 *         description: Erreur interne du serveur.
 */
    app.post('/auth/login', async (req: Request, res: Response) => {
        try {

            const validationResult = LoginUserValidation.validate(req.body)
            if (validationResult.error) {
                res.status(400).send(generateValidationErrorMessage(validationResult.error.details))
                return
            }
            const loginUserRequest = validationResult.value

            // valid user exist
            const user = await AppDataSource.getRepository(User).findOneBy({ email: loginUserRequest.email });

            if (!user) {
                res.status(400).send({ error: "username or password not valid" })
                return
            }

            // valid password for this user
            const isValid = await compare(loginUserRequest.password, user.password);
            if (!isValid) {
                res.status(400).send({ error: "username or password not valid" })
                return
            }
            
            const secret = process.env.JWT_SECRET ?? ""
            // generate jwt
            const token = sign({ userId: user.id, email: user.email }, secret, { expiresIn: '1d' });
            // stock un token pour un user
            await AppDataSource.getRepository(Token).save({ token: token, user: user })
            res.status(200).json({ token });
        } catch (error) {
            console.log(error)
            res.status(500).send({ "error": "internal error retry later" })
            return
        }
    })

    /**
 * @swagger
 * /auth/logout:
 *   delete:
 *     summary: Déconnexion de l'utilisateur.
 *     description: Déconnecte l'utilisateur actuellement authentifié en supprimant tous ses jetons d'authentification.
 *     tags:
 *       - Authentification
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Déconnexion réussie.
 *       '400':
 *         description: Requête invalide, voir le corps de la réponse pour plus de détails.
 *       '401':
 *         description: Utilisateur non autorisé.
 *       '404':
 *         description: Jeton d'authentification non trouvé.
 *       '500':
 *         description: Erreur interne du serveur.
 */

    app.delete('/auth/logout', authMiddleware , async (req: Request, res: Response) => {
        try {

            const authHeader = req.headers['authorization'];
            if (!authHeader) return res.status(401).json({"error": "Unauthorized"});

            const token = authHeader.split(' ')[1];
            if (token === null) return res.status(401).json({"error": "Unauthorized"});

            const queryToken = AppDataSource.createQueryBuilder(Token, 'token')
            queryToken.innerJoinAndSelect('token.user','user')
            queryToken.where('token.token= token',{token: token})
            const tokenFound = await queryToken.getOne()

            if(!tokenFound) {
                return res.status(404).json({"error": `Token ${token} not found`});
            }

            const user = await AppDataSource.getRepository(User).findOneBy({ id: tokenFound.user.id });

            if (!user) {
                res.status(400).send({ error: "User not found" })
                return
            }

            const repoTokenUser = AppDataSource.getRepository(Token)
            const queryTokens = AppDataSource.createQueryBuilder(Token, 'token')
            queryTokens.innerJoinAndSelect('token.user','user')
            queryTokens.where('user.id= :userId',{userId: user.id})
            const tokensFound = await queryTokens.getMany()

            tokensFound.forEach((token) => {
                repoTokenUser.delete(token)
            })

            res.status(200).send("Deconnexion réussi");
        } catch (error) {
            console.log(error)
            res.status(500).send({ "error": "internal error retry later" })
            return
        }
    })
}


