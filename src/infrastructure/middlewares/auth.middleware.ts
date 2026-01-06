import "@/shared/types/http-request";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { CognitoIdTokenPayload } from "aws-jwt-verify/jwt-model";
import { NextFunction, Request, Response } from "express";
import * as crypto from "crypto";

interface HashArgs {
  secret: string;
  payload: string;
  verify: string;
}

const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: "id",
  clientId: process.env.COGNITO_CLIENT_ID!,
});

export const AuthGuard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  if (isWebhook(req.path)) {
    return webhookAuth(req, res, next);
  }

  if (isPublicRoute(req.path)) {
     const authHeader = req.headers.authorization as string | null;
     if (authHeader) {
        const [scheme, token] = authHeader.split(" ");
        if (scheme === "Bearer" && token === process.env.DOCUSIGN_WEBHOOK_KEY) {
           return next();
        }
     }
  }


  const authHeader = req.headers.authorization as string | null;
  if (!authHeader) {
    return res
      .status(401)
      .json({ message: "Token de autorização não fornecido" });
  }



  try {
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Formato de token inválido" });
    }

    const payload = (await jwtVerifier.verify(token)) as CognitoIdTokenPayload;

    req.user = {
      sub: payload.sub as string,
      email: payload.email as string,
      username: payload["cognito:username"] as string,
    };

    next();
  } catch (error) {
    console.error("Erro na verificação do token:", error);
    return res.status(401).json({
      message: "Token inválido ou expirado",
    });
  }
};

const isPublicRoute = (path: string) => {
  const publicRoutes = [
    "/customer/:customerId/eligibility",
    "/dependent/cpf/:cpf",
    "/customer/:customerId"
  ];

  return publicRoutes.some((route) => {
    const pattern = new RegExp("^" + route.replace(/:[^/]+/g, "[^/]+") + "$");
    return pattern.test(path);
  });
};

const isWebhook = (path: string) => path.includes("webhook/docusign");

const webhookAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const signature = req.headers["x-docusign-signature-1"] as string | undefined;
    if (!signature) {
      return res.status(401).json({ message: "Assinatura ausente" });
    }
    const rawBody = JSON.stringify(req.body);
    
    const valid = isHashValid({
      secret: process.env.DOCUSIGN_WEBHOOK_KEY!,
      payload: rawBody,
      verify: signature,
    });

    if (!valid) {
      return res.status(401).json({ message: "Assinatura inválida" });
    }

    next();
  } catch (err) {
    return res.status(500).json({ message: "Erro interno na verificação" });
  }
};

const computeHash = (args: Omit<HashArgs, "verify">): string => {
  const hmac = crypto.createHmac("sha256", args.secret);
  hmac.update(args.payload);
  return hmac.digest("base64");
};

const isHashValid = (args: HashArgs): boolean => {
  const computed = computeHash({ secret: args.secret, payload: args.payload });
  return crypto.timingSafeEqual(
    Buffer.from(args.verify, "base64"),
    Buffer.from(computed, "base64")
  );
};