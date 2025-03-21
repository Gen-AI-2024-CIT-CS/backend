import csv
import psycopg2
import re
import os
import pandas as pd
from pathlib import Path

# Database connection details
db_params = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT"),
}

# Department mapping
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
pattern = re.compile(r'^\d{2}(' + '|'.join(valid_depts) + r')\d{3}$', re.IGNORECASE)

def extract_dept(roll_no):
    match = pattern.match(roll_no)
    return dept_mapping.get(match.group(1).upper()) if match else None

def is_valid_student(row):
    # Check if email ends with citchennai.net AND has a valid department in roll number
    is_valid_email = row['Email Id'].endswith("citchennai.net")
    dept_full_form = extract_dept(row['College Roll Number'])
    return is_valid_email and dept_full_form is not None

def insert_students():
    current_path = Path(__file__).parent
    file_path = current_path / "students.csv"

    # First, validate all student records
    invalid_data = []
    all_data = []
    
    with open(file_path, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            all_data.append(row)
            if row['Profession'] == "student" and not is_valid_student(row):
                invalid_data.append(row)
    
    # If any invalid data is found, don't insert anything
    
    if invalid_data:
        print("Invalid Data:")
        for idx, row in enumerate(invalid_data, 1):
            print(f"{idx}. {row}")
        print(f"Total invalid records: {len(invalid_data)}")
             
        # return
    
    # If all data is valid, proceed with insertion
    df = pd.read_csv(file_path, encoding="utf-8")
    
    df = df.rename(columns={'Course Id': 'course_id', 'CourseName': 'course_name'})
    df['course_id'] = df['course_id'].str.replace('_', '-')
    df = df[['course_id', 'course_name']].drop_duplicates()
    
    with psycopg2.connect(**db_params) as conn:
        with conn.cursor() as cursor:
            # Insert course data
            for _, row in df.iterrows():
                cursor.execute('''
                    INSERT INTO course (course_id, course_name) 
                    VALUES (%s, %s) 
                    ON CONFLICT (course_id) DO NOTHING;
                ''', (row['course_id'], row['course_name']))
            
            # Insert student data
            for row in all_data:
                if row['Profession'] == "faculty":
                    cursor.execute('''
                        INSERT INTO student(name, email, gender, role) 
                        VALUES (%s, %s, %s, %s) 
                        ON CONFLICT (email) DO NOTHING
                    ''', (row['Name'], row['Email Id'], row['Gender'], row['Profession']))
                elif is_valid_student(row):   # All students are valid at this point
                    study_year = int(row['Study Year'])
                    dept_full_form = extract_dept(row['College Roll Number'])
                    
                    cursor.execute('''
                        INSERT INTO student(name, email, roll_no, gender, role, dept, year) 
                        VALUES (%s, %s, %s, %s, %s, %s, %s) 
                        ON CONFLICT (email) DO NOTHING
                    ''', (row['Name'], row['Email Id'], row['College Roll Number'].upper(), row['Gender'], 
                          row['Profession'], dept_full_form, study_year))
    
    print("All data inserted successfully.")

if __name__ == "__main__":
    insert_students()
