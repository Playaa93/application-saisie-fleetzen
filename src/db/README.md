# Database Module

## Overview

This module contains the complete database schema, migrations, and seed data for the Form Application built with **Drizzle ORM** and **PostgreSQL**.

## Structure

```
src/db/
├── schema.ts              # Complete database schema with 9 tables
├── index.ts               # Database connection and utilities
├── seed.ts                # Seed data for development
├── migrations/            # SQL migration files
│   └── 0000_initial_schema.sql
└── README.md             # This file
```

## Schema Tables

### Core Tables
1. **organizations** - Multi-tenant organization management
2. **users** - User accounts with authentication
3. **forms** - Form definitions with settings
4. **form_fields** - Individual form field configurations
5. **submissions** - Form submission metadata
6. **submission_data** - Actual submission values

### Supporting Tables
7. **form_analytics** - Daily form analytics and metrics
8. **webhooks** - Webhook configurations for form events
9. **audit_logs** - Complete audit trail

## Quick Start

### 1. Environment Setup

Copy the example environment file:
```bash
cp .env.example .env
```

Configure your database connection:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/forms_db
```

### 2. Install Dependencies

```bash
npm install drizzle-orm pg
npm install -D drizzle-kit @types/pg
```

### 3. Run Migrations

```bash
# Generate migrations from schema
npx drizzle-kit generate:pg

# Apply migrations
npx drizzle-kit push:pg

# Or use the programmatic approach
npm run db:migrate
```

### 4. Seed Database (Development)

```bash
npm run db:seed
```

Or programmatically:
```typescript
import { seedDatabase } from '@/db/seed';
await seedDatabase();
```

## Usage Examples

### Database Connection

```typescript
import { db, checkDatabaseHealth } from '@/db';

// Check database health
const isHealthy = await checkDatabaseHealth();

// Use the database
const users = await db.select().from(schema.users);
```

### Querying Data

```typescript
import { db } from '@/db';
import { users, forms, submissions } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// Get user by email
const user = await db
  .select()
  .from(users)
  .where(eq(users.email, 'user@example.com'))
  .limit(1);

// Get published forms with submissions count
const publishedForms = await db
  .select({
    id: forms.id,
    title: forms.title,
    submissionCount: forms.submissionCount,
  })
  .from(forms)
  .where(eq(forms.status, 'published'))
  .orderBy(desc(forms.createdAt));

// Get form with fields (using relations)
const formWithFields = await db.query.forms.findFirst({
  where: eq(forms.id, formId),
  with: {
    fields: {
      orderBy: (fields, { asc }) => [asc(fields.order)],
    },
  },
});
```

### Inserting Data

```typescript
import { db } from '@/db';
import { users, forms, formFields } from '@/db/schema';
import type { NewUser, NewForm, NewFormField } from '@/db/schema';

// Insert a new user
const newUser: NewUser = {
  email: 'newuser@example.com',
  passwordHash: await hashPassword('password'),
  fullName: 'New User',
  role: 'user',
};

const [user] = await db.insert(users).values(newUser).returning();

// Insert a form
const newForm: NewForm = {
  userId: user.id,
  title: 'Contact Form',
  slug: 'contact',
  status: 'draft',
};

const [form] = await db.insert(forms).values(newForm).returning();

// Insert form fields
const fields: NewFormField[] = [
  {
    formId: form.id,
    type: 'text',
    label: 'Name',
    name: 'name',
    isRequired: true,
    order: 1,
  },
  {
    formId: form.id,
    type: 'email',
    label: 'Email',
    name: 'email',
    isRequired: true,
    order: 2,
  },
];

await db.insert(formFields).values(fields);
```

### Updating Data

```typescript
import { db } from '@/db';
import { forms, submissions } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Update form status
await db
  .update(forms)
  .set({
    status: 'published',
    publishedAt: new Date(),
  })
  .where(eq(forms.id, formId));

// Mark submission as reviewed
await db
  .update(submissions)
  .set({
    status: 'reviewed',
    reviewedBy: userId,
    reviewedAt: new Date(),
    reviewNotes: 'Looks good!',
  })
  .where(eq(submissions.id, submissionId));
```

### Transactions

```typescript
import { db, withTransaction } from '@/db';
import { forms, formFields, submissions } from '@/db/schema';

// Use transaction helper
await withTransaction(async (tx) => {
  // All operations in this block are transactional
  const [form] = await tx.insert(forms).values(newForm).returning();
  await tx.insert(formFields).values(fields.map(f => ({ ...f, formId: form.id })));

  // If any operation fails, all will be rolled back
});

// Or use the Drizzle transaction API directly
await db.transaction(async (tx) => {
  await tx.insert(forms).values(newForm);
  await tx.insert(formFields).values(fields);
});
```

### Complex Queries with Joins

```typescript
import { db } from '@/db';
import { forms, submissions, submissionData, formFields } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

// Get submission with all data
const submissionWithData = await db
  .select({
    submissionId: submissions.id,
    submissionToken: submissions.submissionToken,
    createdAt: submissions.createdAt,
    fieldName: submissionData.fieldName,
    fieldLabel: formFields.label,
    value: submissionData.value,
  })
  .from(submissions)
  .innerJoin(submissionData, eq(submissions.id, submissionData.submissionId))
  .innerJoin(formFields, eq(submissionData.fieldId, formFields.id))
  .where(eq(submissions.id, submissionId));

// Aggregate query - forms with submission counts
const formStats = await db
  .select({
    formId: forms.id,
    formTitle: forms.title,
    totalSubmissions: sql<number>`count(${submissions.id})`,
  })
  .from(forms)
  .leftJoin(submissions, eq(forms.id, submissions.formId))
  .groupBy(forms.id, forms.title);
```

## Schema Relationships

### Entity Relationships

```
Organizations (1) ─┬─< Users (N)
                   │
                   └─< Forms (N)
                         │
                         ├─< FormFields (N)
                         │
                         ├─< Submissions (N)
                         │     │
                         │     └─< SubmissionData (N)
                         │
                         ├─< FormAnalytics (N)
                         │
                         └─< Webhooks (N)
```

### Using Relations

```typescript
// Query with relations
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    organization: true,
    forms: {
      with: {
        fields: true,
        submissions: {
          limit: 10,
          orderBy: (submissions, { desc }) => [desc(submissions.createdAt)],
        },
      },
    },
  },
});
```

## Migration Management

### Generate Migration

When you modify the schema:

```bash
# Generate migration SQL
npx drizzle-kit generate:pg

# This creates a new file in src/db/migrations/
```

### Apply Migrations

```bash
# Push schema changes to database
npx drizzle-kit push:pg

# Or use the migrate function
npm run db:migrate
```

### Rollback (Manual)

```bash
# Connect to database
psql $DATABASE_URL

# Run rollback commands manually
DROP TABLE IF EXISTS "new_table";
```

## Development Tools

### Drizzle Studio

Visual database browser:

```bash
npx drizzle-kit studio
```

Access at: http://localhost:4983

### Database Introspection

Generate schema from existing database:

```bash
npx drizzle-kit introspect:pg
```

## Performance Optimization

### Indexes

All tables have strategic indexes:

```sql
-- Example: Composite index for common query
CREATE INDEX "forms_user_slug_idx" ON "forms"("user_id", "slug");

-- JSONB index for nested queries
CREATE INDEX "forms_settings_idx" ON "forms" USING GIN (settings);
```

### Query Optimization Tips

1. **Use indexes wisely**
   ```typescript
   // ✅ Good - uses index
   .where(eq(forms.userId, userId))

   // ❌ Bad - no index
   .where(sql`LOWER(${forms.title}) = 'test'`)
   ```

2. **Select only needed columns**
   ```typescript
   // ✅ Good
   .select({ id: forms.id, title: forms.title })

   // ❌ Bad
   .select()  // selects all columns
   ```

3. **Use pagination**
   ```typescript
   .limit(20)
   .offset(page * 20)
   ```

4. **Use prepared statements for repeated queries**
   ```typescript
   const prepared = db
     .select()
     .from(users)
     .where(eq(users.id, sql.placeholder('userId')))
     .prepare();

   await prepared.execute({ userId: '123' });
   ```

## Testing

### Test Database Setup

```typescript
// tests/setup.ts
import { db, runMigrations } from '@/db';

beforeAll(async () => {
  await runMigrations();
});

afterAll(async () => {
  await closeDatabaseConnection();
});
```

### Example Test

```typescript
import { db } from '@/db';
import { users } from '@/db/schema';

describe('User CRUD', () => {
  it('should create a user', async () => {
    const [user] = await db.insert(users).values({
      email: 'test@example.com',
      passwordHash: 'hash',
      fullName: 'Test User',
    }).returning();

    expect(user.email).toBe('test@example.com');
  });
});
```

## Security Best Practices

1. **Never expose password hashes**
   ```typescript
   // ✅ Good
   const user = await db
     .select({
       id: users.id,
       email: users.email,
       fullName: users.fullName,
     })
     .from(users);

   // ❌ Bad
   const user = await db.select().from(users);
   ```

2. **Use parameterized queries** (Drizzle does this automatically)

3. **Validate input before database operations**
   ```typescript
   import { z } from 'zod';

   const userSchema = z.object({
     email: z.string().email(),
     fullName: z.string().min(2),
   });

   const validated = userSchema.parse(input);
   await db.insert(users).values(validated);
   ```

4. **Use transactions for related operations**

## Troubleshooting

### Connection Issues

```typescript
// Check connection
const isHealthy = await checkDatabaseHealth();
if (!isHealthy) {
  console.error('Database connection failed');
}
```

### Migration Conflicts

```bash
# Reset migrations (DEVELOPMENT ONLY)
npm run db:reset

# Manual fix
psql $DATABASE_URL -c "DROP TABLE IF EXISTS drizzle_migrations CASCADE"
npx drizzle-kit push:pg
```

### Performance Issues

1. Check query execution plan:
   ```typescript
   const result = await db.execute(sql`
     EXPLAIN ANALYZE
     SELECT * FROM forms WHERE user_id = ${userId}
   `);
   ```

2. Add missing indexes:
   ```sql
   CREATE INDEX CONCURRENTLY idx_name ON table_name(column_name);
   ```

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string

Optional:
- `DB_POOL_MAX` - Max pool connections (default: 20)
- `DB_IDLE_TIMEOUT` - Idle timeout ms (default: 30000)
- `DB_CONNECTION_TIMEOUT` - Connection timeout ms (default: 10000)
- `DB_SSL` - Enable SSL (default: false)

## Type Safety

All types are automatically inferred:

```typescript
import type {
  User, NewUser,
  Form, NewForm,
  Submission, NewSubmission
} from '@/db/schema';

// Type-safe operations
const newUser: NewUser = { ... };
const user: User = await db.insert(users).values(newUser).returning()[0];
```

## Documentation

- **Full Schema Documentation**: `/docs/database-schema.md`
- **API Documentation**: `/docs/api.md`
- **Architecture**: `/docs/architecture.md`

## Support

For issues or questions:
1. Check the schema documentation
2. Review Drizzle ORM docs: https://orm.drizzle.team
3. Check PostgreSQL docs: https://www.postgresql.org/docs/
