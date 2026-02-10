import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

export interface UsersCreatedByOperatorParams {
  startDate: Date;
  endDate: Date;
  operatorEmail?: string;
}

export interface UsersCreatedByOperatorRow {
  id: string;
  name: string;
  email: string;
  cpf: string;
  createdAt: Date;
  createdBy: string | null;
}

export interface DependentPendingDocumentRow {
  dependentName: string;
  dependentCpf: string;
  customerCpf: string;
  status: string;
}

export class ReportService {
  constructor(private readonly prisma: PrismaClient) {}

  async dependentsWithPendingDocuments(): Promise<DependentPendingDocumentRow[]> {
    const dependents = await this.prisma.dependent.findMany({
      where: {
        documents: {
          none: {
            isApproved: true,
          },
        },
      },
      include: {
        customer: true,
        documents: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return dependents.map((dep: any) => {
      const hasDocuments = dep.documents && dep.documents.length > 0;
      return {
        dependentName: dep.name,
        dependentCpf: dep.cpf || "",
        customerCpf: dep.customer?.cpf || "",
        status: hasDocuments ? "documento pendente de aprovação" : "sem documento",
      };
    });
  }

  async usersCreatedByOperators(params: UsersCreatedByOperatorParams): Promise<UsersCreatedByOperatorRow[]> {
    const { startDate, endDate, operatorEmail } = params;

    // Determine operator emails to filter by
    let operatorEmails: string[] | undefined = undefined;
    if (operatorEmail) {
      operatorEmails = [operatorEmail];
    } else {
      const operators: { email: string }[] = await this.prisma.user.findMany({
        where: { role: "OPERATOR" },
        select: { email: true },
      });
      operatorEmails = operators.map((o: { email: string }) => o.email);
    }

    const customers = await this.prisma.customer.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(operatorEmails && operatorEmails.length > 0
          ? { createdBy: { in: operatorEmails } }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        createdAt: true,
        createdBy: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      cpf: c.cpf,
      createdAt: c.createdAt,
      createdBy: c.createdBy,
    }));
  }

  toCsv(rows: UsersCreatedByOperatorRow[]): string {
    const headers = [
      "id",
      "name",
      "email",
      "cpf",
      "createdAt",
      "createdBy",
    ];

    const escape = (val: any) => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      // Escape double quotes
      const escaped = str.replace(/"/g, '""');
      // Wrap in quotes if contains comma or newline
      return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
    };

    const lines = [headers.join(",")];
    for (const row of rows) {
      const values = [
        row.id,
        row.name,
        row.email,
        row.cpf,
        row.createdAt.toISOString(),
        row.createdBy || "",
      ].map(escape);
      lines.push(values.join(","));
    }
    return lines.join("\n");
  }

  toXlsx(rows: UsersCreatedByOperatorRow[]): Buffer {
    const data = rows.map((row) => ({
      ID: row.id,
      Nome: row.name,
      Email: row.email,
      CPF: row.cpf,
      "Criado em": row.createdAt.toISOString(),
      "Criado por": row.createdBy || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
    
    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  }

  dependentsToCsv(rows: DependentPendingDocumentRow[]): string {
    const headers = [
      "dependentName",
      "dependentCpf",
      "customerCpf",
      "status",
    ];

    const escape = (val: any) => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      const escaped = str.replace(/"/g, '""');
      return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
    };

    const lines = [headers.join(",")];
    for (const row of rows) {
      const values = [
        row.dependentName,
        row.dependentCpf,
        row.customerCpf,
        row.status,
      ].map(escape);
      lines.push(values.join(","));
    }
    return lines.join("\n");
  }

  dependentsToXlsx(rows: DependentPendingDocumentRow[]): Buffer {
    const data = rows.map((row) => ({
      "Nome Dependente": row.dependentName,
      "CPF Dependente": row.dependentCpf,
      "CPF Titular": row.customerCpf,
      "Status": row.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dependentes");
    
    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  }
}