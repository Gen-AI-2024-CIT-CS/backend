import csv
import psycopg2
from pathlib import Path
import os

conn = psycopg2.connect(
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT")
)
cursor = conn.cursor()

def get_assignment_headers(headers):
    return [h for h in headers if h.startswith("Week") and "Assignment" in h]

def is_valid_number(s):
    try:
        float(s)
        return True
    except ValueError:
        return False

def clean_assignment_value(value):
    return float(value) if is_valid_number(value) else 0

current_path = Path(__file__).parent
file_path = current_path / "mentee.csv"

with open(file_path, "r") as file:
    reader = csv.reader(file)
    headers = next(reader)
    d = {header: i for i, header in enumerate(headers)}
    assignment_headers = get_assignment_headers(headers)
    num_assignments = len(assignment_headers)

    for row in reader:
        # Extend row with zeros if needed
        row.extend([0] * (3 + num_assignments - len(row)))
         
        # Prepare data for insertion
        data = [
            row[d["Name"]],
            row[d["Email"]],
            row[d["Roll Number"]]
        ]
        
        for header in assignment_headers:
            value = row[d[header]] if d[header] < len(row) else '0'
            data.append(clean_assignment_value(value))
       
        placeholders = ', '.join(['%s'] * (3 + num_assignments))
        columns = ', '.join(['name', 'email', 'roll_no'] + [f'assignment{i}' for i in range(num_assignments)])
        
        query = f"""
        INSERT INTO assignments ({columns})
        VALUES ({placeholders})
        ON CONFLICT (email) DO NOTHING
        """
        
        try:
            cursor.execute(query, tuple(data))
        except Exception as e:
            print(f"Error: {e}")

conn.commit()
cursor.close()
conn.close()