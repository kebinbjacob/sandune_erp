# Sandune Next.js Codebase Investigation Handoff Report

## 1. Observation

### 1.1 Project Structure & Routing Architecture
- **Framework & Dependencies**:
  - `package.json` (lines 13-16):
    ```json
    "dependencies": {
      "next": "16.2.10",
      "react": "19.2.4",
      "react-dom": "19.2.4",
      "recharts": "^3.10.1"
    }
    ```
  - `package.json` (lines 18-31) shows testing packages (`@testing-library/react` v16.3.2, `jest` v29.7.0, `jest-environment-jsdom`) and TypeScript v5.
  - No Tailwind CSS, SCSS, or third-party UI component libraries (like Shadcn, MUI, Chakra) are listed in `package.json`.
- **Routing Paradigm**:
  - Next.js **App Router** is used under `src/app/`. There is no `pages/` directory.
  - Root layout (`src/app/layout.tsx`, lines 27-38) sets up a global grid with a fixed left `Sidebar` (`width: 280px` in `Sidebar.module.css`:2) and top `Navbar`:
    ```tsx
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Sidebar />
        <div style={{ marginLeft: "280px", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <Navbar />
          <main style={{ padding: "32px", flex: 1 }}>
            {children}
          </main>
        </div>
      </body>
    </html>
    ```

### 1.2 `/employees` Route & Employee Listing
- **File Location**: `src/app/employees/page.tsx`
- **Component Nature**: Server Component (no `'use client'` directive present).
- **Data Source (Mock Data)**: In-file array `employees` (lines 7-12):
  ```tsx
  const employees = [
    { id: "EMP-001", name: "John Doe", role: "Site Engineer", project: "Skyline Tower", status: "Active" },
    { id: "EMP-002", name: "Sarah Smith", role: "Project Manager", project: "Ocean View Residences", status: "Active" },
    { id: "EMP-003", name: "Mike Johnson", role: "Safety Officer", project: "Skyline Tower", status: "On Leave" },
    { id: "EMP-004", name: "Emily Chen", role: "Architect", project: "Metro Station", status: "Active" },
  ];
  ```
- **Rendering Logic**:
  - Columns definition (lines 14-28) defines columns: `ID`, `Name`, `Role`, `Project`, `Status`.
  - Custom renderer for status badge (lines 22-26):
    ```tsx
    render: (value: string) => (
      <span className={`${styles.statusBadge} ${value === 'Active' ? styles.statusActive : styles.statusLeave}`}>
        {value}
      </span>
    )
    ```
  - Rendered using `<Card>` wrapping search/role filter UI controls and `<Table columns={columns} data={employees} />` (lines 41-51).
  - Header link button (line 38):
    ```tsx
    <Link href="/create?type=Add%20Employee" className={styles.primaryButton}>+ Add Employee</Link>
    ```

### 1.3 "Add Employee" Component & Form Logic
- **File Locations**:
  - Primary form component: `src/app/create/page.tsx` (`CreatePage` / `CreateForm`).
  - Secondary alias route: `src/app/employees/new/page.tsx`, which contains:
    ```tsx
    export { default } from "../../create/page";
    ```
  - Navigation references: Header button links to `/create?type=Add%20Employee` (`src/app/employees/page.tsx`:38); Sidebar link points to `/employees/new` (`src/components/Sidebar.tsx`:23).
- **Component Nature**: Client Component (`"use client"` directive at line 1 of `src/app/create/page.tsx`).
- **Form Fields & Inputs**:
  - Uses generic input fields rather than employee-specific schema fields:
    1. Name / Title input (`src/app/create/page.tsx`:33): `<input type="text" required className={styles.searchInput} placeholder="Enter add employee name" />`
    2. Category / Type selector (`src/app/create/page.tsx`:37-41): `<select>` with options `"Standard"`, `"Premium"`, `"Urgent"`.
    3. Notes / Description textarea (`src/app/create/page.tsx`:46): `<textarea className={styles.searchInput} rows={4} style={{ resize: 'vertical' }}></textarea>`
- **State Handling & Submit Logic**:
  - Uncontrolled form inputs (no React `useState` managing field values).
  - Search query param read via `useSearchParams().get('type')` (line 11). Wrapped in React `<Suspense>` fallback at line 60.
  - Form submit handler `handleSubmit` (lines 13-17):
    ```tsx
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      alert(`Successfully created new ${type}!`);
      router.back();
    };
    ```
  - No database insertion, API call, or local state persistence exists on form submit.

### 1.4 Glassmorphic Styling System Architecture
- **Global Theme Variables (`src/app/globals.css`, lines 1-26)**:
  - Dark Theme palette:
    - `--bg-primary: #0f172a` (Slate 900)
    - `--bg-secondary: #1e293b` (Slate 800)
    - `--bg-tertiary: rgba(30, 41, 59, 0.7)` (Slate 800 with 70% opacity)
  - Typography colors:
    - `--text-primary: #f8fafc`
    - `--text-secondary: #94a3b8`
  - Accent Gradients:
    - `--accent-primary: #6366f1` (Indigo 500)
    - `--accent-hover: #4f46e5`
    - `--accent-gradient: linear-gradient(135deg, #6366f1 0%, #a855f7 100%)` (Indigo to Purple)
  - Border & Glow:
    - `--border-light: rgba(255, 255, 255, 0.1)`
    - `--border-hover: rgba(255, 255, 255, 0.2)`
    - `--shadow-glow: 0 0 20px rgba(99, 102, 241, 0.2)`
- **Glassmorphism Utility Class (`src/app/globals.css`, lines 55-60)**:
  ```css
  .glass {
    background: var(--bg-tertiary);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--border-light);
  }
  ```
- **Interactive Utility Class (`src/app/globals.css`, lines 62-70)**: `.hover-lift` applies `-2px` translateY, `--shadow-glow` box shadow, and `--border-hover` border color on hover.
- **Component Styling (`Card.tsx`, `Table.tsx`, `page.module.css`)**:
  - `Card` combines `styles.card` with global `glass` and `hover-lift` classes (`Card.tsx`:13).
  - `Table` builds containers with `background: var(--bg-secondary)` and `border: 1px solid var(--border-light)` (`Table.module.css`:4-7).
  - Badges use translucent background overlays (`rgba(16, 185, 129, 0.2)` for active, `rgba(245, 158, 11, 0.2)` for leave).

---

## 2. Logic Chain

1. **Observation 1.1 → Conclusion on Project Routing**:
   - `src/app/` contains all route folders (`employees`, `create`, `attendance`, `leave`, `projects`, etc.) and `layout.tsx`. No `src/pages` directory exists. `package.json` confirms Next.js `16.2.10`.
   - Therefore, the project exclusively uses Next.js App Router architecture.

2. **Observation 1.2 → Conclusion on Employee Listing**:
   - `src/app/employees/page.tsx` defines static inline `employees` array with 4 employee objects (EMP-001 through EMP-004).
   - The page has no state, fetch calls, or Supabase client integration.
   - Therefore, employee listing is currently static mock data rendered via generic `<Table>` and `<Card>` components.

3. **Observation 1.3 → Conclusion on Add Employee Form**:
   - `/employees` page links to `/create?type=Add%20Employee`, and `Sidebar.tsx` links to `/employees/new`.
   - `/employees/new/page.tsx` re-exports `/create/page.tsx`.
   - `src/app/create/page.tsx` renders generic fields (`Name / Title`, `Category / Type`, `Notes / Description`) rather than HR-specific fields (such as `email`, `role`, `department`, `salary`, `start_date`).
   - `handleSubmit` only alerts the user and calls `router.back()`.
   - Therefore, the current Add Employee implementation is a placeholder generic creation form with no state persistence or backend connectivity.

4. **Observation 1.4 → Conclusion on Styling Architecture**:
   - `package.json` has zero utility framework dependencies (no Tailwind, CSS-in-JS, or Bootstrap).
   - Global variables in `src/app/globals.css` establish CSS custom properties (`--bg-primary`, `--bg-secondary`, `--bg-tertiary`, `--accent-gradient`).
   - Components import scoped CSS Modules (`page.module.css`, `Card.module.css`, `Table.module.css`, `Sidebar.module.css`).
   - Glassmorphism is implemented via CSS backdrop blur (`backdrop-filter: blur(12px)`) and semi-transparent RGBA borders/backgrounds (`rgba(30, 41, 59, 0.7)`).

---

## 3. Caveats

- **No Backend / Database Currently Integrated**: Supabase client initialization or database migrations (`supabase/`) are not currently present in the codebase.
- **Form Schema Discrepancy**: The existing generic `CreateForm` component is shared across all module creation links (`?type=Add%20Employee`, `?type=Project`, etc.) and lacks dedicated HR input controls.
- **Dual Creation Paths**: Clicking "+ Add Employee" on `/employees` routes to `/create?type=Add%20Employee`, while clicking "Add Employee" in `Sidebar` routes to `/employees/new`. (Though `/employees/new` re-exports `/create/page.tsx`, query params differ: `/employees/new` defaults `type` to `'Record'` while `/create?type=Add%20Employee` passes `'Add Employee'`).

---

## 4. Conclusion

The Sandune codebase is a modern Next.js 16 (App Router) TypeScript application styled using a custom Vanilla CSS Glassmorphic design system with CSS Modules.

Key findings for Milestone 1:
1. **Routing**: Standard App Router structure (`src/app/`).
2. **Employees Route (`/employees`)**: Renders static mock data (4 employees) using a reusable `<Table>` component inside a glassmorphic `<Card>`.
3. **Add Employee Component**: Currently uses a shared, generic form at `src/app/create/page.tsx` (re-exported at `src/app/employees/new/page.tsx`) with uncontrolled generic inputs (Name, Category, Notes) and no backend submission logic (`alert()` only).
4. **Styling System**: CSS variables in `globals.css` define dark palette, glassmorphism (`.glass` with backdrop blur), and accent gradients, combined with scoped `.module.css` files per component.

---

## 5. Verification Method

To independently verify the observations and findings in this report:

1. **Verify App Router Structure & Layout**:
   - Inspect `src/app/layout.tsx` lines 27–38 to confirm root layout structure.
   - Inspect `src/app/employees/page.tsx` to confirm Server Component structure and hardcoded `employees` array at lines 7–12.
2. **Verify Add Employee Form Logic**:
   - Inspect `src/app/create/page.tsx` lines 13–17 to confirm `handleSubmit` alert and `router.back()` calls.
   - Inspect `src/app/employees/new/page.tsx` line 1 to confirm re-export of `create/page`.
3. **Verify Glassmorphic Styling**:
   - Inspect `src/app/globals.css` lines 55–60 for `.glass` class and lines 1–26 for theme variables.
4. **Run Project Build & Tests**:
   - Run `npm test` or `npx jest` to execute unit test suite (e.g. `src/app/employees/page.test.tsx`).
