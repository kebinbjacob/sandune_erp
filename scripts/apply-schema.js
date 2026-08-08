const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    envVars[key] = value.trim();
  }
});

const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const key = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Connecting to Supabase at:', url);

const supabase = createClient(url, key);

async function applySchemaAndVerify() {
  const sqlPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  console.log('Read supabase/schema.sql file successfully.');

  // Try querying tables to see if they exist
  const tables = ['employees', 'attendance', 'leave_requests'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table '${table}' query result:`, error.message);
    } else {
      console.log(`Table '${table}' exists. Count sample:`, data.length);
    }
  }

  // Seed employees if empty or needed
  const seedEmployees = [
    { employee_id: 'EMP-001', name: 'John Doe', email: 'john.doe@sandune.com', phone: '+1-555-0101', role: 'Site Engineer', department: 'Engineering', project: 'Skyline Tower', status: 'Active', salary: 85000 },
    { employee_id: 'EMP-002', name: 'Sarah Smith', email: 'sarah.smith@sandune.com', phone: '+1-555-0102', role: 'Project Manager', department: 'Management', project: 'Ocean View Residences', status: 'Active', salary: 95000 },
    { employee_id: 'EMP-003', name: 'Mike Johnson', email: 'mike.johnson@sandune.com', phone: '+1-555-0103', role: 'Safety Officer', department: 'Safety', project: 'Skyline Tower', status: 'On Leave', salary: 75000 },
    { employee_id: 'EMP-004', name: 'Emily Chen', email: 'emily.chen@sandune.com', phone: '+1-555-0104', role: 'Architect', department: 'Design', project: 'Metro Station', status: 'Active', salary: 90000 },
  ];

  const { data: existing, error: fetchErr } = await supabase.from('employees').select('*');
  if (!fetchErr) {
    if (!existing || existing.length === 0) {
      console.log('Inserting seed employees...');
      const { data: inserted, error: insertErr } = await supabase.from('employees').insert(seedEmployees).select();
      if (insertErr) {
        console.error('Error inserting seed employees:', insertErr);
      } else {
        console.log(`Inserted ${inserted.length} seed employees successfully.`);
      }
    } else {
      console.log(`Employees table already has ${existing.length} records.`);
    }
  }
}

applySchemaAndVerify().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
