import csv
import psycopg2
from pathlib import Path
import sys
import os

if len(sys.argv) < 2:
    print("Error: User role argument missing")
    sys.exit(1)

userName = sys.argv[1]
courseID = sys.argv[2]
print("Received Name Argument:", sys.argv[1] , sys.argv[2])

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
            # print("Executing query:", cursor.mogrify(query, tuple(data)).decode())  # This will show the actual query with values
            cursor.execute(query, tuple(data))
            cursor.execute(menteeQuery, tuple(data[1:4] + [userName]))
        except Exception as e:
            print(f"Error: {e}")
            print(f"Failed data: {data}")

conn.commit()
cursor.close()
conn.close()