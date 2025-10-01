import IHttpServer from "@/shared/interfaces/http/http-server";
import { HttpMethod } from "@/shared/types/http-method.enum";

export class HealthController {
  constructor(
    private readonly httpServer: IHttpServer
  ) { }

  registerRoutes() {
    // Endpoint raiz para verificar se a aplicação está funcionando
    this.httpServer.registerPublic(HttpMethod.GET, "/", async () => {
      return {
        message: "Advantage Backend API is running",
        status: "ok",
        timestamp: new Date().toISOString(),
        version: "1.0.0"
      };
    });

    // Endpoint de health check para monitoramento
    this.httpServer.registerPublic(HttpMethod.GET, "/health", async () => {
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();
      
      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: {
          seconds: Math.floor(uptime),
          human: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
        },
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
        },
        environment: process.env.NODE_ENV || "development",
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      };
    });
  }
}