import csv
import psycopg2
import re

# Connect to your PostgreSQL database
conn = psycopg2.connect(
    dbname="nptel",
    user="postgres",
    password="YOUR PASSWORD HERE",
    host="localhost",  # or your db host
    port="5432"
)
cursor = conn.cursor()
valid_depts =  ['AD','AM','CZ','CS',
                'EC','EE','IT','VL',
                'AC','BM','CB','CE',
                'MT','ME']

pattern = re.compile(r'^\d{2}(' + '|'.join(valid_depts) + r')\d{3}$',re.IGNORECASE)
# Open the CSV file
with open('Student.csv', 'r') as file:
    reader = csv.reader(file)
    next(reader)  # Skip the header row if there is one

    # Iterate over each row in the CSV
    for row in reader:
        if(row[4] == "student"):
            row[-1] = int(row[-1][-1])
        if row[4] == "faculty":
            cursor.execute('''
                           INSERT INTO student(name,email,gender,role) VALUES 
                           (%s, %s, %s, %s) 
                           ON CONFLICT (email) DO NOTHING
                           ''',
                           (row[0],row[1],row[3],row[4]))
        elif(row[1].endswith("citchennai.net") or pattern.match(row[2])):
            cursor.execute('''
                           INSERT INTO student VALUES 
                           (%s, %s, %s, %s, %s, %s, %s) 
                           ON CONFLICT (email) DO NOTHING
                           ''',
                           row)
        else:
            print(f"Invalid Data : {row}")

# Commit the transaction
conn.commit()

# Close the connection
cursor.close()
conn.close()

print("Data inserted successfully.")
