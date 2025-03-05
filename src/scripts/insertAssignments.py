import csv
import psycopg2
from pathlib import Path
import sys
import os

if len(sys.argv) < 3:
    print("Error: User role argument missing")
    sys.exit(1)

userName = sys.argv[1]
courseID = sys.argv[2]
print("Received Name Argument:", userName, courseID)

conn = psycopg2.connect(
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT")
)
cursor = conn.cursor()

def get_assignment_headers(headers):
    assignments = [h for h in headers if h.startswith("Week") and "Assignment" in h]
    if "Week 0 : Assignment 0" not in assignments:
        assignments.insert(0, "Week 0 : Assignment 0")  # Ensure "Week 0" is the first assignment
    return assignments

def is_valid_number(s):
    try:
        float(s)
        return True
    except ValueError:
        return False

def clean_assignment_value(value):
    if is_valid_number(value):
        return float(value)
    elif value.lower() == 'submitted':
        return -1
    else:
        return 0

current_path = Path(__file__).parent
file_path = current_path / "mentee.csv"

with open(file_path, "r") as file:
    reader = csv.reader(file)
    headers = next(reader)
    d = {header: i for i, header in enumerate(headers)}
    assignment_headers = get_assignment_headers(headers)
    num_assignments = len(assignment_headers)
    
    for row in reader:
        row.extend([0] * (3 + num_assignments - len(row)))  # Extend row to ensure no missing values
        
        data = [
            row[d["Name"]],
            row[d["Email"]],
            row[d["Roll Number"]]
        ]
        
        for header in assignment_headers:
            if header in d and d[header] < len(row):
                value = row[d[header]]
            else:
                value = '0'  # Default for missing Week 0
            
            data.append(clean_assignment_value(value))
        
        placeholders = ', '.join(['%s'] * (3 + num_assignments))
        columns = ', '.join(['name', 'email', 'roll_no'] + [f'assignment{i}' for i in range(num_assignments)])
        
        menteePlaceholders = ', '.join(['%s'] * 4)
        menteeColumns = ', '.join(['name', 'email', 'roll_no', 'mentor_name'])
        
        menteeQuery = f"""
        INSERT INTO mentee ({menteeColumns})
        VALUES ({menteePlaceholders})
        ON CONFLICT (email) DO NOTHING
        """

        query = f"""
        INSERT INTO assignments (courseID, {columns})
        VALUES (%s, {placeholders})
        ON CONFLICT (courseID,email) DO UPDATE SET
        {', '.join([f'assignment{i} = EXCLUDED.assignment{i}' for i in range(num_assignments)])}
        """
        data.insert(0, courseID)
        try:
            cursor.execute(query, tuple(data))
            cursor.execute(menteeQuery, tuple(data[1:4] + [userName]))
        except Exception as e:
            print(f"Error: {e}")
            print(f"Failed data: {data}")

conn.commit()
cursor.close()
conn.close()
