# 🗄️ Database Backup & Recovery Plan

## 🚨 What Happened
- **Issue**: Complete data loss - 0 projects, 0 tasks, 0 users in database
- **Database**: PostgreSQL on Render (healthy structure, but empty)
- **Cause**: Most likely database recreation during deployment or maintenance

## 🔍 Immediate Actions Required

### 1. Check Render Dashboard
- [ ] Go to Render Dashboard → Your PostgreSQL Service
- [ ] Check "Snapshots" or "Backups" section
- [ ] Look for automatic backups from before data loss
- [ ] If found, restore from most recent backup before the issue

### 2. Check for Multiple Database Instances
- [ ] Verify you're connecting to the correct database
- [ ] Check if there are multiple PostgreSQL services in your Render account
- [ ] Compare DATABASE_URL with your actual database instances

### 3. Check Deployment Logs
- [ ] Review recent deployment logs for migration errors
- [ ] Look for any "DROP TABLE" or "TRUNCATE" commands
- [ ] Check for schema conflicts that might have triggered recreation

## 🛡️ Prevention Measures (Implement IMMEDIATELY)

### A. Automated Database Backups
```bash
# 1. Set up automated daily backups
# Add to package.json scripts:
"backup:create": "npx prisma db execute --url $DATABASE_URL --file ./scripts/backup.sql",
"backup:restore": "npx prisma db execute --url $DATABASE_URL --file ./backups/latest.sql"
```

### B. Environment Safety
```bash
# 2. Add database backup before migrations
"premigrate": "npm run backup:create",
"migrate": "npx prisma migrate deploy"
```

### C. Multiple Environment Protection
```env
# 3. Use different databases for different environments
DATABASE_URL_PRODUCTION="postgres://..."
DATABASE_URL_STAGING="postgres://..."
DATABASE_URL_DEVELOPMENT="postgres://..."
```

### D. Render Configuration
```yaml
# 4. In render.yaml - ensure backup retention
databases:
  - name: postgresmuralla
    databaseName: postgresmuralla
    user: postgresmuralla_user
    plan: starter  # or paid plan with better backup retention
    backup_retention: 30  # Keep 30 days of backups
```

## 📋 Weekly Backup Routine

### Manual Backup Commands
```bash
# Export full database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Backup just your important tables
pg_dump $DATABASE_URL -t projects -t tasks -t users > essential_backup.sql

# Upload to cloud storage (implement this)
# aws s3 cp backup_$(date +%Y%m%d).sql s3://your-backup-bucket/
```

### Automated Backup Script
```javascript
// scripts/backup-to-cloud.js
const { execSync } = require('child_process');
const fs = require('fs');

async function backupDatabase() {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `backup_${timestamp}.sql`;
  
  try {
    // Create backup
    execSync(`pg_dump ${process.env.DATABASE_URL} > ${filename}`);
    
    // Upload to cloud storage (implement your preferred service)
    // await uploadToS3(filename);
    
    console.log(`✅ Backup created: ${filename}`);
  } catch (error) {
    console.error('❌ Backup failed:', error);
  }
}

// Run daily via cron or GitHub Actions
if (require.main === module) {
  backupDatabase();
}
```

## 🔄 Recovery Procedures

### If Backup Exists
```bash
# 1. Stop application
# 2. Drop current database (if corrupted)
dropdb $DATABASE_NAME

# 3. Create new database  
createdb $DATABASE_NAME

# 4. Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD.sql

# 5. Run migrations if needed
npx prisma migrate deploy

# 6. Restart application
```

### If No Backup Available
```bash
# 1. Create fresh database structure
npx prisma migrate reset

# 2. Seed with minimal data
npx prisma db seed

# 3. Manually recreate critical data
# (This is why backups are CRITICAL!)
```

## 📊 Monitoring Setup

### Database Health Checks
```javascript
// Add to your health endpoint
app.get('/health/database', async (req, res) => {
  try {
    const projectCount = await prisma.project.count();
    const userCount = await prisma.user.count();
    
    res.json({
      status: 'healthy',
      projects: projectCount,
      users: userCount,
      lastCheck: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

### Alerts Setup
- Set up Render alerts for database issues
- Monitor database size trends
- Alert if record counts drop significantly

## 🚨 Emergency Contacts

### If Data Loss Happens Again:
1. **Don't panic** - Stop making changes immediately
2. **Contact Render Support** - They may have hidden backups
3. **Check version control** - Look for any seed data in git
4. **Document everything** - What was lost, when, potential causes

### Render Support Links:
- Dashboard: https://dashboard.render.com
- Support: https://render.com/support
- Status Page: https://status.render.com

## 📝 Notes

- **Current Status**: Database structure intact, data missing
- **Next Steps**: Check Render backups, implement prevention measures
- **Priority**: Recovery first, then prevention setup
- **Frequency**: Weekly manual backups until automated system is setup