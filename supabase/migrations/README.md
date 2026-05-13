# DroneLappen migrations

## When you add a new table

Copy `TEMPLATE.sql` and follow the four sections in order: table → grants → RLS → policies.

The **explicit grants** step is the one that's easy to forget but will break the Data API after **2026-10-30**. From that date Supabase stops auto-granting `anon` / `authenticated` / `service_role` on new tables in the `public` schema. PostgREST will return HTTP 401 / `42501` with the exact GRANT statement to fix it.

Source: <https://github.com/orgs/supabase/discussions/45329>

Tables created before Oct 30, 2026 keep their existing grants — this rule applies to NEW tables only.

## When you add a SECURITY DEFINER function

Always pin `search_path`. Use the empty + fully-qualified pattern:

```sql
SET search_path = ''
AS $function$
  SELECT ... FROM public.your_table ...
$function$;
```

This satisfies advisor `0011_function_search_path_mutable` and prevents same-schema search_path injection.

## Repo ↔ production sync note

The repo migrations (`001`, `002`, `003`) cover the original schema, stats logging, and the May 2026 search_path fix. The full live migration history (RLS lockdown, entitlements, uuid migration, question-bank corrections) lives in the database — run `mcp list_migrations` against project `wenjugvnxjmvbvlgnnhh` for the canonical list. Don't try to retroactively recreate those files; just keep new migrations in sync going forward.
