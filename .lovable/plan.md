

## Root Cause

You have **two conflicting tables** for fee configuration:

1. **`fee_config`** (singular) — created by the original `2024_01_01_000001_create_all_tables` migration. This table has UUID primary keys and a `name` column. Your Laravel `FeeConfig` model points to this table (`$table = 'fee_config'`).

2. **`fee_configs`** (plural) — created by the newer `2026_03_09_131503_create_fee_configs_table` migration. This table likely uses BIGINT auto-increment and is **missing the `name` column**.

The seeder is trying to insert into `fee_configs` (Laravel's default pluralized table name resolution is being overridden by the model's `$table = 'fee_config'`), but something is routing the query to the wrong table — or the new migration altered the model behavior.

## The Fix

You have two options. Since your model already defines `$table = 'fee_config'` and the original migration already created that table correctly, you need to:

**On your server (SSH or cPanel Terminal), run:**

```sql
DROP TABLE IF EXISTS fee_configs;
```

Then roll back the bad migration record:

```sql
DELETE FROM migrations WHERE migration = '2026_03_09_131503_create_fee_configs_table';
```

Then re-run the seeder:

```bash
php artisan db:seed --force
```

This removes the duplicate `fee_configs` table and ensures the seeder writes to the correct `fee_config` table (which already has the `name` column).

## Why This Happened

The SQL script from the earlier message created `fee_configs` (plural, BIGINT) which conflicts with the existing `fee_config` (singular, UUID) table that was already created by your main migration. The `FeeConfig` model explicitly sets `$table = 'fee_config'`, so the new table was never needed.

