const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCustomer() {
  try {
    const customerId = 'b747780e-3ba3-405a-bb30-19fbcee0fe6f';
    
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        address: true
      }
    });

    if (!customer) {
      console.log('❌ Customer não encontrado!');
      return;
    }

    console.log('✅ Customer encontrado:');
    console.log('ID:', customer.id);
    console.log('Nome:', customer.name);
    console.log('Email:', customer.email);
    console.log('CPF:', customer.cpf);
    console.log('Telefone:', customer.phone);
    console.log('Data de criação:', customer.createdAt);
    
    if (customer.address) {
      console.log('Endereço:', customer.address);
    }

    // Verificar se o email é válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(customer.email);
    console.log('Email válido:', isValidEmail ? '✅' : '❌');

  } catch (error) {
    console.error('Erro ao buscar customer:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCustomer();