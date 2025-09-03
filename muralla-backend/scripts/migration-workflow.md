# 🚀 Migration Workflow Documentation

## Backup-Before-Migration System

The backup system has been integrated into the migration workflow to prevent data loss during database schema changes.

### Available Commands

```bash
# Create manual backup
npm run backup:create

# Create pre-migration backup (used automatically)
npm run backup:pre-migration

# List all backups
npm run backup:list

# Restore from backup (use with caution)
npm run backup:restore <filename>

# Run migration with automatic backup
npm run migrate

# Production deployment with backup
npm run start:prod
```

### How It Works

1. **Automatic Pre-Migration Backup**: Before any migration, a backup is automatically created
2. **Migration Safety**: If backup fails, migration is aborted (exit code 1)
3. **Backup Storage**: All backups are stored in `./backups/` directory
4. **Backup Retention**: Maximum 30 backups kept (oldest deleted automatically)

### Backup Types

- **Manual**: `backup_manual_YYYY-MM-DD_HH-mm-ss.sql`
- **Pre-migration**: `backup_pre-migration_YYYY-MM-DD_HH-mm-ss.sql`

### Fallback Strategy

Due to PostgreSQL version mismatch between local client (14.17) and server (17.6), the system uses:

1. **Primary**: pg_dump with compatibility flags
2. **Docker Alternative**: Uses PostgreSQL 17 Docker image
3. **Fallback**: Creates schema preservation file

### Production Setup

- Render deployment configured with 30-day backup retention
- Backup created before each production deployment
- Migration only proceeds if backup succeeds

### Recovery Process

1. **Check Render Dashboard**: Look for automated backups
2. **Use Local Backups**: From `./backups/` directory
3. **Manual Recovery**: Use `npm run backup:restore <filename>`

### Monitoring

The system logs:
- ✅ Successful backup creation with file size
- ⚠️  Warning messages for version mismatches
- ❌ Critical errors that abort migrations
- 🧹 Cleanup operations for old backups

This ensures no migration can proceed without a safety backup, preventing future data loss incidents.