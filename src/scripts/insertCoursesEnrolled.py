import csv
import os
import psycopg2
from pathlib import Path

def clean_and_truncate(value, max_length):
    return str(value).strip()[:max_length]

conn = psycopg2.connect(
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT")
)
cursor = conn.cursor()

current_path = Path(__file__).parent
file_path = current_path / "Registered.csv"

try:
    with open(file_path, "r") as file:
        reader = csv.DictReader(file)
        
        for row in reader:
            # Prepare data for insertion
            data = (
                clean_and_truncate(row['Course id'], 50),
                clean_and_truncate(row['Course Name'], 255),
                clean_and_truncate(row['Emailid'], 255),
                clean_and_truncate(row['Status'], 255),
                clean_and_truncate(row['Choice 1 State'], 50),
                clean_and_truncate(row['Choice 1 City'], 50)
            )
            
            # INSERT query
            insert_query = """
            INSERT INTO courses_enrolled 
            (course_id, course_name, email, status, choice1_state, choice1_city)
            VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT (email) DO NOTHING
            """
            
            try:
                cursor.execute(insert_query, data)
                print(f"Inserted: Course ID {data[0]}, Email {data[2]}")
            except psycopg2.Error as e:
                print(f"Error inserting record: Course ID {data[0]}, Email {data[2]}. Error: {e}")
                conn.rollback()
                continue

    # Commit the transaction
    conn.commit()
    print("Data insertion process completed.")

except (Exception, psycopg2.Error) as error:
    print(f"Error: {error}")
    conn.rollback()

finally:
    if cursor:
        cursor.close()
    if conn:
        conn.close()