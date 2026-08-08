import { getEmployees, createEmployee } from '../src/lib/services/employeeService';
import { supabase } from '../src/lib/supabase/client';

async function testSupabaseIntegration() {
  console.log("=== EMPIRICAL TEST 1: Supabase Service Integration ===");
  console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  try {
    const employees = await getEmployees();
    console.log("SUCCESS: getEmployees() returned:", employees.length, "employees");
    if (employees.length > 0) {
      console.log("Sample employee:", JSON.stringify(employees[0]));
    }
  } catch (err: any) {
    console.error("FAILURE / NOTICE: getEmployees() threw error:", err?.message || err);
  }

  try {
    const testEmployee = {
      employee_id: `EMP-TEST-${Date.now().toString().slice(-4)}`,
      name: "Empirical Tester",
      role: "Test Engineer",
      department: "QA",
      project: "Sandune Test",
      email: "tester@sandune.com",
      status: "Active"
    };
    console.log("Attempting createEmployee() with payload:", testEmployee);
    const created = await createEmployee(testEmployee);
    console.log("SUCCESS: createEmployee() returned:", JSON.stringify(created));
  } catch (err: any) {
    console.error("FAILURE / NOTICE: createEmployee() threw error:", err?.message || err);
  }
}

testSupabaseIntegration();
