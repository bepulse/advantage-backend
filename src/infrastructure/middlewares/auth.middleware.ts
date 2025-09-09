import "@/shared/types/http-request";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { CognitoIdTokenPayload } from "aws-jwt-verify/jwt-model";
import { NextFunction, Request, Response } from "express";

const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: "id",
  clientId: process.env.COGNITO_CLIENT_ID!,
});

export const AuthGuard = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization as string | null;
  if (!authHeader) {
    return res.status(401).json({ message: "Token de autorização não fornecido" });
  }

  try {
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Formato de token inválido" });
    }

    const payload = await jwtVerifier.verify(token) as CognitoIdTokenPayload;

    req.user = {
      sub: payload.sub as string,
      email: payload.email as string,
      username: payload['cognito:username'] as string,
    };

    next();
  } catch (error) {
    console.error("Erro na verificação do token:", error);
    return res.status(401).json({
      message: "Token inválido ou expirado",
    });
  }
};
