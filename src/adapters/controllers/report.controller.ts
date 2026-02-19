import IHttpServer from "@/shared/interfaces/http/http-server";
import { HttpMethod } from "@/shared/types/http-method.enum";
import { ReportService } from "@/application/services/report.service";

export class ReportController {
  constructor(
    private readonly httpServer: IHttpServer,
    private readonly reportService: ReportService
  ) {}

  registerRoutes() {
    this.httpServer.register(
      HttpMethod.GET,
      "/reports/users-created-by-operator",
      async ({ query, response }) => {
        const { startDate, endDate, operatorEmail, format } = query || {};

        if (!startDate || !endDate) {
          throw new Error("startDate and endDate query parameters are required");
        }

        const start = new Date(String(startDate));
        const end = new Date(String(endDate));

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
          throw new TypeError("Invalid startDate or endDate format");
        }

        const data = await this.reportService.usersCreatedByOperators({
          startDate: start,
          endDate: end,
          operatorEmail: operatorEmail ? String(operatorEmail) : undefined
        });

        if (String(format).toLowerCase() === "csv") {
          const csv = this.reportService.toCsv(data);
          if (response) {
            response.setHeader("Content-Type", "text/csv; charset=utf-8");
            response.setHeader(
              "Content-Disposition",
              `attachment; filename="users-created-by-operator.csv"`
            );
          }
          return csv;
        }

        if (String(format).toLowerCase() === "xlsx") {
          const buffer = this.reportService.toXlsx(data);
          if (response) {
            response.setHeader(
              "Content-Type",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            response.setHeader(
              "Content-Disposition",
              `attachment; filename="users-created-by-operator.xlsx"`
            );
          }
          return buffer;
        }

        return data;
      }
    );

    this.httpServer.register(
      HttpMethod.GET,
      "/reports/dependents-pending-documents",
      async ({ query, response }) => {
        const { format } = query || {};

        const data = await this.reportService.dependentsWithPendingDocuments();

        if (String(format).toLowerCase() === "csv") {
          const csv = this.reportService.dependentsToCsv(data);
          if (response) {
            response.setHeader("Content-Type", "text/csv; charset=utf-8");
            response.setHeader(
              "Content-Disposition",
              `attachment; filename="dependents-pending-documents.csv"`
            );
          }
          return csv;
        }

        if (String(format).toLowerCase() === "xlsx") {
          const buffer = this.reportService.dependentsToXlsx(data);
          if (response) {
            response.setHeader(
              "Content-Type",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            response.setHeader(
              "Content-Disposition",
              `attachment; filename="dependents-pending-documents.xlsx"`
            );
          }
          return buffer;
        }

        return data;
      }
    );

    this.httpServer.register(
      HttpMethod.GET,
      "/reports/totals",
      async ({ query }) => {
        const { startDate, endDate, planId } = query || {};

        const params: {
          startDate?: Date;
          endDate?: Date;
          planId?: string;
        } = {};

        if (startDate) {
          const d = new Date(String(startDate));
          if (!Number.isNaN(d.getTime())) {
            params.startDate = d;
          }
        }

        if (endDate) {
          const d = new Date(String(endDate));
          if (!Number.isNaN(d.getTime())) {
            params.endDate = d;
          }
        }

        if (planId) {
          params.planId = String(planId);
        }

        return await this.reportService.totals(params);
      }
    );
  }
}
