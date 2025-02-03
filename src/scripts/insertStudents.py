import csv
import psycopg2
import re
import os
from pathlib import Path

conn = psycopg2.connect(
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT")
)
cursor = conn.cursor()

dept_mapping = {
    'AD': 'Artificial Intelligence and Data Science',
    'AM': 'Artificial Intelligence and Machine Learning',
    'CZ': 'Cyber Security',
    'CS': 'Computer Science and Engineering',
    'EC': 'Electronics and Communication Engineering',
    'EE': 'Electrical and Electronics Engineering',
    'IT': 'Information Technology',
    'VL': 'VLSI',
    'AC': 'Advanced Communication Technology',
    'BM': 'Bio Medical Engineering',
    'CB': 'Computer Science and Business Systems',
    'CE': 'Civil Engineering',
    'MT': 'Mechatronics',
    'ME': 'Mechanical Engineering'
}

valid_depts = list(dept_mapping.keys())
pattern = re.compile(r'^(\d{2})(' + '|'.join(valid_depts) + r')\d{3}$', re.IGNORECASE)

def extract_dept(roll_no):
    match = pattern.match(roll_no)
    if match:
        dept_code = match.group(2).upper()
        return dept_mapping.get(dept_code, dept_code)
    return None

current_path = Path(__file__).parent
file_path = current_path / "students.csv"

with open(file_path, 'r') as file:
    reader = csv.DictReader(file)

    for row in reader:
        if row['Role'] == "student":
            study_year = int(row['Study year'][-1])
        else:
            study_year = None

        dept_full_form = extract_dept(row['College Roll Number'])

        if row['Role'] == "faculty":
            cursor.execute('''
                INSERT INTO student(name, email, gender, role) VALUES 
                (%s, %s, %s, %s) 
                ON CONFLICT (email) DO NOTHING
            ''', (row['Name'], row['Emailid'], row['Gender'], row['Role']))
        elif row['Emailid'].endswith("citchennai.net") or dept_full_form:
            cursor.execute('''
                INSERT INTO student(name, email, roll_no, gender, role, dept, year) VALUES 
                (%s, %s, %s, %s, %s, %s, %s) 
                ON CONFLICT (email) DO NOTHING
            ''', (row['Name'], row['Emailid'], row['College Roll Number'], row['Gender'], row['Role'], dept_full_form, study_year))
        else:
            print(f"Invalid Data : {row}")

conn.commit()

cursor.close()
conn.close()

print("Data inserted successfully.")