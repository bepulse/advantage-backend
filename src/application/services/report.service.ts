import { PrismaClient } from "@prisma/client";

export interface UsersCreatedByOperatorParams {
  startDate: Date;
  endDate: Date;
  operatorEmail?: string;
}

export interface UsersCreatedByOperatorRow {
  id: string;
  email: string;
  role: string;
  customerId?: string | null;
  createdAt: Date;
  createdBy?: string | null;
}

export class ReportService {
  constructor(private readonly prisma: PrismaClient) {}

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

    const users: {
      id: string;
      email: string;
      role: string;
      customerId: string | null;
      createdAt: Date;
      createdBy: string | null;
    }[] = await this.prisma.user.findMany({
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
        email: true,
        role: true,
        customerId: true,
        createdAt: true,
        createdBy: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return users.map((u: {
      id: string;
      email: string;
      role: string;
      customerId: string | null;
      createdAt: Date;
      createdBy: string | null;
    }) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      customerId: u.customerId,
      createdAt: u.createdAt,
      createdBy: u.createdBy,
    }));
  }

  toCsv(rows: UsersCreatedByOperatorRow[]): string {
    const headers = [
      "id",
      "email",
      "role",
      "customerId",
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
        row.email,
        row.role,
        row.customerId || "",
        row.createdAt.toISOString(),
        row.createdBy || "",
      ].map(escape);
      lines.push(values.join(","));
    }
    return lines.join("\n");
  }
}