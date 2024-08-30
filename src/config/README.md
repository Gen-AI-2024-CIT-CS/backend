 
## Database Setup

This section provides instructions on how to set up the database for the project.

### Prerequisites

Ensure you have the following Installed 

- **PostgreSQL**
- **pgAdmin**
- **SQL shell(psql)**


### Step 1: Create the Database

First, create a new database called `nptel` by running the following command in your PostgreSQL client:

```sql
CREATE DATABASE nptel;

```
Now connect to the Database:
```sql
\c nptel
```
### Step 2: Create the Necessary Tables

Run the following SQL commands to create the required tables for the project:

```sql
-- Create Student Table
CREATE TABLE Student(
    name varchar(255), 
    Email varchar(255) PRIMARY KEY, 
    Roll_no varchar(255), 
    Gender varchar(50), 
    Role varchar(50), 
    Dept varchar(255), 
    Year int
);

-- Create Course Table
CREATE TABLE Course(
    Course_name varchar(255) UNIQUE NOT NULL, 
    course_id varchar(50) PRIMARY KEY
);

-- Create Students_enrolled Table
CREATE TABLE Students_enrolled(
    Course_name varchar(255), 
    Course_id varchar(50), 
    Email varchar(255)
);

-- Create Users Table
CREATE TABLE Users(
    email varchar(255), 
    password varchar(255)
);
```

### Step 3: Insert Data into the Student Table

To insert data into the Student table, follow these steps:

#### Create a Temporary table

First, create a temporary table to hold the student data:

```sql
CREATE TEMP TABLE temp_student AS SELECT * FROM Student LIMIT 0;
```
#### Insert Data into the Temporary Table
Load data from your CSV file into the temporary table using the 

\COPY command. Replace 'F:/path/to/Students.csv' with the actual path to your CSV file:
```sql
\COPY temp_student FROM 'F:/path/to/Students.csv' DELIMITER ',' CSV HEADER;
```
#### Insert Data into the Student Table
Transfer the data from the temporary table to the Student table. If there are any conflicts with existing Email values, they will be ignored:

```sql
INSERT INTO Student (name, Email, Roll_no, Gender, Role, Dept, Year)
SELECT name, Email, Roll_no, Gender, Role, Dept, Year FROM temp_student
ON CONFLICT (Email) DO NOTHING;
```
#### Delete the Temporary Table
After the data has been successfully inserted, drop the temporary table:
```sql
DROP TABLE temp_student;
```

### STEP 4: Insert Data into Course Table

Install psycopg2 if not already installed
```cmd
psycopg2
```
Run insert students.py and ensure student.csv and the py file is in the same directory