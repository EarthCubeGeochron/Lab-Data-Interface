-- Create event trigger to log schema changes ...
SELECT pgmemento.create_schema_event_trigger(TRUE);

-- Start auditing for tables in `public` schema
SELECT pgmemento.create_schema_audit(
  'public', TRUE, ARRAY['spatial_ref_sys']);
