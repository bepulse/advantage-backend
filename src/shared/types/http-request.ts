
declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        email?: string;
        username?: string;
        role?: string;
        [key: string]: any;
      };
    }
  }
}