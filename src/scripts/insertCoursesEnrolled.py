import csv
import os
import psycopg2
from pathlib import Path
import sys

# Set default encoding to utf-8

def clean_and_truncate(value, max_length):
    """Cleans and truncates string values to avoid errors."""
    return str(value).strip()[:max_length] if value else None  # Handle None values

# Database connection
conn = psycopg2.connect(
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT")
)
conn.set_client_encoding('UTF8')  # Set client encoding to UTF-8
cursor = conn.cursor()

months = {
    "jan": 1,
    "feb": 2,
    "mar": 3,
    "apr": 4,
    "may": 5,
    "jun": 6,
    "jul": 7,
    "aug": 8,
    "sep": 9,
    "oct": 10,
    "nov": 11,
    "dec": 12
}
# Get CSV file path
current_path = Path(__file__).parent
file_path = current_path / "Registered.csv"

try:
    with open(file_path, "r", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        
        # Get available columns
        available_columns = reader.fieldnames
        # print("CSV Columns:", available_columns)  # Debugging

        for row in reader:
            # Required fields (always present)
            course_id = clean_and_truncate(row['Course Id'], 50)
            course_name = clean_and_truncate(row['CourseName'], 255)
            email = clean_and_truncate(row['Email Id'], 255)
            timeline = clean_and_truncate(row['Timeline'], 50)

            # Optional fields (check if they exist)
            status = clean_and_truncate(row.get('Status', None), 255) if 'Status' in available_columns else None
            choice1_state = clean_and_truncate(row.get('Choice 1 State', None), 50) if 'Choice 1 State' in available_columns else None
            choice1_city = clean_and_truncate(row.get('Choice 1 City', None), 50) if 'Choice 1 City' in available_columns else None
            
            timeline_months, year = timeline.split()
            start_month, end_month = timeline_months.split("-")
            start_month = months[start_month.lower()]
            end_month = months[end_month.lower()]
            year = int(year)
            semester = "even" if start_month < 7 else "odd"
           

            # Insert or update query
            insert_query = """
            INSERT INTO courses_enrolled (course_id, course_name, email, status, choice1_state, choice1_city, start_month, end_month, year,semester)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (email, course_id) 
            DO UPDATE SET 
                status = COALESCE(EXCLUDED.status, courses_enrolled.status),
                choice1_state = COALESCE(EXCLUDED.choice1_state, courses_enrolled.choice1_state),
                choice1_city = COALESCE(EXCLUDED.choice1_city, courses_enrolled.choice1_city);
            """

            data = (course_id, course_name, email, status, choice1_state, choice1_city, start_month, end_month, year,semester)
            # print(data)
            try:
                cursor.execute(insert_query, data)
                # print(f"Inserted/Updated: Course ID {course_id}, Email {email}")

            except psycopg2.Error as e:
                # print(f"Error inserting/updating record: Course ID {course_id}, Email {email}. Error: {e}")
                conn.rollback()
                continue  # Skip to next row

    # Commit the transaction
    conn.commit()
    # print("Data insertion process completed.")

except (Exception, psycopg2.Error) as error:
    print(f"Error: {error}")
    conn.rollback()

finally:
    if cursor:
        cursor.close()
    if conn:
        conn.close()