const fs = require('fs');
const path = require('path');

const schemaPath = path.resolve(__dirname, '../../supabase/schema.sql');
const sqlContent = fs.readFileSync(schemaPath, 'utf8');

console.log("=== Checking supabase/schema.sql for UNIQUE constraints ===");

const checks = [
  {
    name: "employee_id UNIQUE constraint in employees table",
    pattern: /employee_id\s+text\s+UNIQUE/i,
  },
  {
    name: "email UNIQUE constraint in employees table",
    pattern: /email\s+text\s+UNIQUE/i,
  },
  {
    name: "unique_employee_date CONSTRAINT in attendance table",
    pattern: /CONSTRAINT\s+unique_employee_date\s+UNIQUE\s*\(\s*employee_id\s*,\s*date\s*\)/i,
  }
];

let allPassed = true;
checks.forEach(check => {
  const match = check.pattern.test(sqlContent);
  if (match) {
    console.log(`[PASS] Found: ${check.name}`);
  } else {
    console.log(`[FAIL] Missing or mismatch: ${check.name}`);
    allPassed = false;
  }
});

if (!allPassed) {
  process.exit(1);
} else {
  console.log("All required SQL UNIQUE constraints confirmed in schema.sql!");
}
