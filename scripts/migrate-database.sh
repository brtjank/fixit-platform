#!/bin/bash

# Script to run EF Core migrations
# Usage: ./scripts/migrate-database.sh

set -e

echo "Running EF Core migrations..."

cd "$(dirname "$0")/../src/FixIt.Infrastructure"

dotnet ef database update --startup-project ../FixIt.Api --context FixItDbContext

echo "Migrations completed successfully!"
