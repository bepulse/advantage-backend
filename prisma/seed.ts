import { PrismaClient, UserRole, AddressType, Relationship, DocumentKind } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Iniciando seed de contas (Customers, Users, etc)...');

  // Admin principal
  const admin = await prisma.user.create({
    data: {
      email: 'admin@advantage.com',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  // Operadores
  await prisma.user.createMany({
    data: [
      { email: 'operator1@advantage.com', role: UserRole.OPERATOR },
      { email: 'operator2@advantage.com', role: UserRole.OPERATOR },
    ],
  });

  // Clientes mockados
  const customers = [
    {
      name: 'Gabriel Marques',
      cpf: '12345678901',
      birthDate: new Date('1994-05-12'),
      email: 'gabriel@example.com',
      phone: '+55 11 91234-5678',
      createdBy: 'operator1@advantage.com',
    },
    {
      name: 'Ana Rosa',
      cpf: '98765432100',
      birthDate: new Date('1998-07-03'),
      email: 'ana.rosa@example.com',
      phone: '+55 11 99876-5432',
      createdBy: 'operator2@advantage.com',
    },
  ];

  for (const customer of customers) {
    const created = await prisma.customer.create({
      data: {
        ...customer,
        address: {
          create: {
            type: AddressType.HOME,
            street: 'Rua dos Exemplos',
            number: '42',
            district: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            zipcode: '01001000',
            createdBy: customer.createdBy,
          },
        },
        users: {
          create: [
            {
              email: `${customer.name.toLowerCase().replace(/\s/g, '.')}@customer.com`,
              role: UserRole.CUSTOMER,
              createdBy: customer.createdBy,
            },
          ],
        },
        dependents: {
          create: [
            {
              name: `${customer.name.split(' ')[0]} Filho`,
              relationship: Relationship.CHILD,
              birthDate: new Date('2010-01-15'),
              eligible: true,
              createdBy: customer.createdBy,
            },
            {
              name: `${customer.name.split(' ')[0]} Parceiro`,
              relationship: Relationship.PARTNER,
              birthDate: new Date('1995-03-20'),
              eligible: false,
              createdBy: customer.createdBy,
            },
          ],
        },
        documents: {
          create: [
            {
              kind: DocumentKind.CPF,
              fileName: `${customer.name}-cpf.pdf`,
              filePath: `/uploads/${randomUUID()}.pdf`,
              mimeType: 'application/pdf',
              sizeBytes: 256000,
              isApproved: true,
              createdBy: customer.createdBy,
            },
          ],
        },
        contract: {
          create: {
            envelopeId: randomUUID(),
            status: 'completed',
            documentType: 'customer_agreement',
            createdBy: customer.createdBy,
          },
        },
      },
    });

    console.log(`✅ Cliente criado: ${created.name}`);
  }

  console.log('🌱 Seed de contas finalizado!');
}

main()
  .catch((e: unknown) => {
    console.error('❌ Erro durante seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });