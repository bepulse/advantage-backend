#!/bin/sh
set -e

echo "🚀 Starting Advantage Backend..."

# Controla execução de migrações via env RUN_MIGRATIONS (true/1 para habilitar)
RUN_MIGRATIONS=${RUN_MIGRATIONS:-false}

if [ "$RUN_MIGRATIONS" = "true" ] || [ "$RUN_MIGRATIONS" = "1" ]; then
  echo "📦 Running database migrations (RUN_MIGRATIONS=${RUN_MIGRATIONS})..."
  if npx prisma migrate deploy; then
    echo "✅ Migrations completed successfully"
  else
    echo "❌ Migration failed"
    exit 1
  fi
else
  echo "⏭️ Skipping migrations (RUN_MIGRATIONS=${RUN_MIGRATIONS})"
fi

# Iniciar a aplicação
echo "🌟 Starting application..."
exec node dist/index.js