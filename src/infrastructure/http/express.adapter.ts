import express from 'express';
import IHttpServer from '@/shared/interfaces/http/http-server';
import HttpError from '@/shared/errors/http.error';
import cors from 'cors';
import { AuthGuard } from '../middlewares/auth.middleware';

export class ExpressAdapter implements IHttpServer {
    app: any;

    constructor() {
        this.app = express();
        this.app.use(express.json());
        this.app.use(AuthGuard);
        this.app.use(cors({
            origin: '*',
            credentials: true,
        }));
    }

    register(method: string, url: string, callback: Function): void {
        this.app[method](url, async (req: any, res: any) => {
            try {
                const output = await callback(req);
                res.json(output);
            } catch (error: any) {
                if (error instanceof HttpError) {
                    res.status(error.statusCode).json({ message: error.message });
                } else {
                    res.status(500).json({ message: "Internal Server Error", innerMessage: error.message });
                }
            }
        });
    }

    listen(port: number): void {
        return this.app.listen(port);
    }
}