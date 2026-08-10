-- ==========================================
-- Phase 1 & 2: CRM & Resources 
-- ==========================================

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  contact_person text,
  email text,
  phone text,
  address text,
  status text DEFAULT 'Active',
  created_at timestamptz DEFAULT now()
);

-- Contractors
CREATE TABLE IF NOT EXISTS contractors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  specialization text NOT NULL,
  contact_person text,
  phone text,
  email text,
  status text DEFAULT 'Active',
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now()
);

-- Vendors
CREATE TABLE IF NOT EXISTS vendors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  contact_person text,
  phone text,
  email text,
  status text DEFAULT 'Active',
  created_at timestamptz DEFAULT now()
);

-- Materials (Inventory)
CREATE TABLE IF NOT EXISTS materials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name text NOT NULL,
  category text NOT NULL,
  current_stock numeric DEFAULT 0,
  unit text NOT NULL,
  reorder_level numeric DEFAULT 0,
  location text,
  status text DEFAULT 'Healthy',
  created_at timestamptz DEFAULT now()
);

-- Equipment (Machinery)
CREATE TABLE IF NOT EXISTS equipment (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  serial_number text,
  current_project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  status text DEFAULT 'Available',
  last_maintenance_date date,
  next_maintenance_date date,
  created_at timestamptz DEFAULT now()
);

-- Procurement (Purchase Orders)
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number text UNIQUE NOT NULL,
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  order_date date NOT NULL,
  expected_delivery date,
  total_amount numeric NOT NULL,
  status text DEFAULT 'Draft',
  created_at timestamptz DEFAULT now()
);

-- Update Projects table to link to clients (optional but good for CRM)
-- We originally created 'client text', but let's add client_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='projects' AND column_name='client_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN client_id uuid REFERENCES clients(id);
  END IF;
END $$;


-- ==========================================
-- RLS Policies
-- ==========================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on clients" ON clients FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on clients" ON clients FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on clients" ON clients FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public select on contractors" ON contractors FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on contractors" ON contractors FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on contractors" ON contractors FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public select on vendors" ON vendors FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on vendors" ON vendors FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on vendors" ON vendors FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public select on materials" ON materials FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on materials" ON materials FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on materials" ON materials FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public select on equipment" ON equipment FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on equipment" ON equipment FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on equipment" ON equipment FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public select on purchase_orders" ON purchase_orders FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on purchase_orders" ON purchase_orders FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on purchase_orders" ON purchase_orders FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Ensure we insert some dummy data so the user isn't stuck with empty lists initially
INSERT INTO clients (name, contact_person, email, phone, address) VALUES 
('Apex Developers', 'Alice Smith', 'alice@apex.com', '555-0192', '100 Main St, City'),
('City Transit Authority', 'Bob Johnson', 'bob@cta.gov', '555-0193', '200 Transit Blvd, City')
ON CONFLICT DO NOTHING;

INSERT INTO contractors (name, specialization, contact_person, phone, email, rating) VALUES 
('Solid Foundations Inc.', 'Foundation & Concrete', 'Mike Hammer', '555-0201', 'mike@solid.com', 5),
('SkyHigh Scaffolding', 'Scaffolding', 'Steve Reach', '555-0202', 'steve@skyhigh.com', 4)
ON CONFLICT DO NOTHING;

INSERT INTO vendors (name, category, contact_person, phone, email) VALUES 
('National Cement Co.', 'Raw Materials', 'Dave Build', '555-0301', 'dave@ncc.com'),
('Heavy Machinists LLC', 'Heavy Machinery', 'Sarah Lift', '555-0302', 'sarah@hm.com')
ON CONFLICT DO NOTHING;
