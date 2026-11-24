-- Run after schema.sql: allow signed-in staff (not anonymous visitors) to use the tables
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function next_party_code(text) to authenticated;
