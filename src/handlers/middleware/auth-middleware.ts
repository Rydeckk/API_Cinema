import { NextFunction, Response, Request } from "express";
import { AppDataSource } from "../../database/database";
import { Token } from "../../database/entities/token";
import { verify } from "jsonwebtoken";
import { Role } from "../../database/entities/role";
import { User } from "../../database/entities/user";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({"error": "Unauthorized"});

    const token = authHeader.split(' ')[1];
    if (token === null) return res.status(401).json({"error": "Unauthorized"});

    const tokenRepo = AppDataSource.getRepository(Token)
    const tokenFound = await tokenRepo.findOne({ where: { token } })
    if (!tokenFound) {
        return res.status(403).json({"error": "Access Forbidden"})
    }
    const secret = process.env.JWT_SECRET ?? ""
    verify(token, secret, (err, user) => {
        if (err) return res.status(403).json({"error": "Access Forbidden"});
        (req as any).user = user;
        next();
    });
}

export const authMiddlewareAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({"error": "Unauthorized"});

    const token = authHeader.split(' ')[1];
    if (token === null) return res.status(401).json({"error": "Unauthorized"});

    const queryToken = AppDataSource.createQueryBuilder(Token, 'token')
    queryToken.innerJoinAndSelect('token.user','user')
    queryToken.where('token.token= :token', {token: token})

    const tokenFound = await queryToken.getOne()
    if (!tokenFound) {
        return res.status(403).json({"error": "Access Forbidden"})
    }

    const queryUser = AppDataSource.createQueryBuilder(User, 'user')
    queryUser.innerJoinAndSelect('user.role','role')
    queryUser.where('user.id= :userId', {userId: tokenFound.user.id})

    const userFound = await queryUser.getOne()

    const repoRole = AppDataSource.getRepository(Role)
    const roleFound = await repoRole.findOneBy({ id:userFound?.role.id })

    const secret = process.env.JWT_SECRET ?? ""
    verify(token, secret, (err, user) => {
        if (err) return res.status(403).json({"error": "Access Forbidden"});
        if (roleFound?.isAdmin !== true) {
            return res.status(403).json({"error": "Access Forbidden, Admin access required"})
        }
        (req as any).user = user;
        next();
    });
}