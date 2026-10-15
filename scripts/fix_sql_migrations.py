import os
import re
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQL_FILE = os.path.join(BASE_DIR, 'supabase', 'combined_migrations.sql')
PUBLIC_SQL_FILE = os.path.join(BASE_DIR, 'public', 'supabase', 'combined_migrations.sql')

with open(SQL_FILE, 'r', encoding='utf-8') as f:
    sql = f.read()

print(f"Original SQL length: {len(sql)} characters")

# 1. Fix CREATE TYPE to DO $$ block
def fix_create_type(content):
    # Match CREATE TYPE <name> AS ENUM (...)
    pattern = r'CREATE\s+TYPE\s+([a-zA-Z0-9_]+)\s+AS\s+ENUM\s*\(([^)]+)\);'
    def repl(m):
        t_name = m.group(1)
        enum_vals = m.group(2)
        return (
            f"DO $$ BEGIN\n"
            f"    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '{t_name}') THEN\n"
            f"        CREATE TYPE {t_name} AS ENUM ({enum_vals});\n"
            f"    END IF;\n"
            f"END $$;"
        )
    return re.sub(pattern, repl, content, flags=re.IGNORECASE)

# 2. Fix ADD COLUMN to ADD COLUMN IF NOT EXISTS
def fix_add_column(content):
    # Match ADD COLUMN <col> -> ADD COLUMN IF NOT EXISTS <col>
    content = re.sub(r'\bADD\s+COLUMN\s+(?!IF\s+NOT\s+EXISTS\b)', 'ADD COLUMN IF NOT EXISTS ', content, flags=re.IGNORECASE)
    return content

# 3. Fix CREATE TRIGGER to ensure DROP TRIGGER IF EXISTS precedes it
def fix_create_trigger(content):
    # Match CREATE (OR REPLACE)? TRIGGER <name> ... ON <table_name>
    pattern = r'(CREATE(?:\s+OR\s+REPLACE)?\s+TRIGGER\s+([a-zA-Z0-9_]+)[\s\S]*?ON\s+([a-zA-Z0-9_\.]+))'
    
    # We want to ensure each CREATE TRIGGER is preceded by DROP TRIGGER IF EXISTS
    lines = content.split('\n')
    out_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        m = re.match(r'^\s*CREATE(?:\s+OR\s+REPLACE)?\s+TRIGGER\s+([a-zA-Z0-9_]+)', line, re.IGNORECASE)
        if m:
            trg_name = m.group(1)
            # Find ON <table_name>
            tbl_name = None
            j = i
            while j < min(i + 10, len(lines)):
                m_tbl = re.search(r'\bON\s+([a-zA-Z0-9_\.]+)', lines[j], re.IGNORECASE)
                if m_tbl:
                    tbl_name = m_tbl.group(1)
                    break
                j += 1
            
            # Check if previous line is already DROP TRIGGER
            prev_line = out_lines[-1] if out_lines else ""
            if tbl_name and trg_name.lower() not in prev_line.lower():
                out_lines.append(f"DROP TRIGGER IF EXISTS {trg_name} ON {tbl_name};")
        out_lines.append(line)
        i += 1
    return '\n'.join(out_lines)

# 4. Fix CREATE POLICY to ensure DROP POLICY IF EXISTS precedes it
def fix_create_policy(content):
    lines = content.split('\n')
    out_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        # Match CREATE POLICY "name" ON table OR CREATE POLICY name ON table
        m = re.match(r'^\s*CREATE\s+POLICY\s+(?:"([^"]+)"|([a-zA-Z0-9_]+))\s+ON\s+([a-zA-Z0-9_\.]+)', line, re.IGNORECASE)
        if m:
            pol_name = m.group(1) or m.group(2)
            tbl_name = m.group(3)
            # Check if previous lines already dropped this policy
            already_dropped = False
            for k in range(max(0, len(out_lines) - 3), len(out_lines)):
                if f'DROP POLICY IF EXISTS "{pol_name}" ON {tbl_name}' in out_lines[k] or f"DROP POLICY IF EXISTS {pol_name} ON {tbl_name}" in out_lines[k]:
                    already_dropped = True
                    break
            
            if not already_dropped:
                out_lines.append(f'DROP POLICY IF EXISTS "{pol_name}" ON {tbl_name};')
        out_lines.append(line)
        i += 1
    return '\n'.join(out_lines)

# Apply fixes
processed_sql = fix_create_type(sql)
processed_sql = fix_add_column(processed_sql)
processed_sql = fix_create_trigger(processed_sql)
processed_sql = fix_create_policy(processed_sql)

# Save to both paths
with open(SQL_FILE, 'w', encoding='utf-8') as f:
    f.write(processed_sql)

os.makedirs(os.path.dirname(PUBLIC_SQL_FILE), exist_ok=True)
with open(PUBLIC_SQL_FILE, 'w', encoding='utf-8') as f:
    f.write(processed_sql)

print(f"Processed SQL length: {len(processed_sql)} characters")
print("Successfully updated supabase/combined_migrations.sql and public/supabase/combined_migrations.sql!")
