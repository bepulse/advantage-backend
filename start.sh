#!/bin/sh

echo "🚀 Starting Advantage Backend..."

# Executar migrações
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Verificar se as migrações foram bem-sucedidas
if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "❌ Migration failed"
    exit 1
fi

# Iniciar a aplicação
echo "🌟 Starting application..."
exec node dist/index.js