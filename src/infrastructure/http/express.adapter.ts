import express from 'express';
import IHttpServer from '@/shared/interfaces/http/http-server';
import HttpError from '@/shared/errors/http.error';
import cors from 'cors';
import multer from 'multer';
import { AuthGuard } from '../middlewares/auth.middleware';

export class ExpressAdapter implements IHttpServer {
    app: any;
    private upload: multer.Multer;

    constructor() {
        this.app = express();
        this.app.use(express.json());
        this.app.use(cors({
            origin: "*",
            credentials: true,
        }));

        this.upload = multer({
            storage: multer.memoryStorage(),
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB limit
            }
        });
    }

    register(method: string, url: string, callback: Function): void {
        if (url.includes('/upload')) {
            this.app[method](url, AuthGuard, this.upload.single('document'), async (req: any, res: any) => {
                try {
                    const output = await callback({
                        body: req.body,
                        params: req.params,
                        query: req.query,
                        user: req.user,
                        file: req.file,
                        response: res
                    });
                    if (output !== undefined && output !== null) {
                        if (Buffer.isBuffer(output) || typeof output === 'string') {
                            res.send(output);
                        } else {
                            res.json(output);
                        }
                    } else if (!res.headersSent) {
                        res.status(204).end();
                    }
                } catch (error: any) {
                    if (error instanceof HttpError) {
                        res.status(error.statusCode).json({ message: error.message });
                    } else {
                        res.status(500).json({ message: "Internal Server Error", innerMessage: error.message });
                    }
                }
            });
        } else {
            this.app[method](url, AuthGuard, async (req: any, res: any) => {
                try {
                    const output = await callback({
                        body: req.body,
                        params: req.params,
                        query: req.query,
                        user: req.user,
                        response: res
                    });
                    if (output !== undefined && output !== null) {
                        if (Buffer.isBuffer(output) || typeof output === 'string') {
                            res.send(output);
                        } else {
                            res.json(output);
                        }
                    } else if (!res.headersSent) {
                        res.status(204).end();
                    }
                } catch (error: any) {
                    if (error instanceof HttpError) {
                        res.status(error.statusCode).json({ message: error.message });
                    } else {
                        res.status(500).json({ message: "Internal Server Error", innerMessage: error.message });
                    }
                }
            });
        }
    }

    registerPublic(method: string, url: string, callback: Function): void {
        this.app[method](url, async (req: any, res: any) => {
            try {
                const output = await callback({
                    body: req.body,
                    params: req.params,
                    query: req.query,
                    response: res
                });
                if (output !== undefined && output !== null) {
                    if (Buffer.isBuffer(output) || typeof output === 'string') {
                        res.send(output);
                    } else {
                        res.json(output);
                    }
                } else if (!res.headersSent) {
                    res.status(204).end();
                }
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
        return this.app.listen(port, '0.0.0.0', () => {
            console.log(`Server is listening on 0.0.0.0:${port}`);
        });
    }
}