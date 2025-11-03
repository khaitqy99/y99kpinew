# Migration: Remove KPI Category and Weight Fields

## Summary
This migration removes the `category` and `weight` columns from the `kpis` table as these fields are no longer needed in the KPI creation process.

## Changes Made

### Database
- **Schema Update**: `database/schema.sql` - Removed `category` and `weight` columns from kpis table definition
- **Migration Script**: `database/migrations/remove-kpi-category-weight.sql` - Drops the columns from existing databases
- **Test Data**: `database/add-more-test-data.sql` - Updated INSERT statements to remove category and weight values

### TypeScript Types
- **Database Types**: `src/lib/supabase.ts` - Removed category and weight from kpis table Row, Insert, and Update types
- **KPI Interface**: `src/types/kpi-config.ts` - Removed category and weight fields from KPI interface
- **Validation**: `src/lib/validation.ts` - Removed category and weight from KpiValidationData and validation logic

### UI Components
- **KPI Dialog**: `src/app/admin/kpis/KpiDialog.tsx` - Removed category and weight from kpiData object
- **KPI Management**: `src/components/KpiManagementTab.tsx` - Removed category and weight from newKpi object
- **KPI Detail Dialog**: `src/app/admin/kpis/KpiDetailDialog.tsx` - Removed category and weight display fields

### Context & Services
- **Supabase Context**: `src/contexts/SupabaseDataContext.tsx` - Removed category and weight from addKpi and editKpi payloads
- **Data Context**: `src/contexts/DataContext.tsx` - Removed getKpiCategories function
- **Services**: `src/services/supabase-service.ts` - Removed VALID_CATEGORIES import

## How to Apply

### For New Databases
Simply run `database/schema.sql` to create the table without these columns.

### For Existing Databases
Run the migration script:
```bash
psql -U your_user -d your_database -f database/migrations/remove-kpi-category-weight.sql
```

Or if using Supabase:
```sql
ALTER TABLE IF EXISTS kpis DROP COLUMN IF EXISTS category;
ALTER TABLE IF EXISTS kpis DROP COLUMN IF EXISTS weight;
```

## Notes
- The migration uses `DROP COLUMN IF EXISTS` for safety
- Existing data in these columns will be lost
- No application code references these fields after this migration

