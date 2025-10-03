const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250103_add_vehicle_site_category.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying migration: 20250103_add_vehicle_site_category.sql');
    console.log('SQL:', sql);

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try alternative method - direct query
      console.log('Trying alternative method...');
      const statements = sql.split(';').filter(s => s.trim());

      for (const statement of statements) {
        if (statement.trim()) {
          console.log('Executing:', statement.substring(0, 50) + '...');
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'POST',
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: statement })
          });

          if (!response.ok) {
            console.error('Statement failed:', statement);
            throw new Error(`Failed to execute statement: ${response.statusText}`);
          }
        }
      }
    }

    console.log('✅ Migration applied successfully!');
    console.log('Added columns: work_site, vehicle_category');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration();
