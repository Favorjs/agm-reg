# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


## TO update the whole database table (this sql command comes in handy when you just want to add new rows without updating the other existing one using acno as the unique identifier)

# First step is to create a Temp table
CREATE TEMP TABLE shareholders_stage (
   acno TEXT,
   name TEXT,
   phoneNumber TEXT,
   holdings TEXT,
   address TEXT,
   email TEXT,
   chn TEXT,
   rin TEXT,
   created_at TIMESTAMP 
);

# then insert the data into the temp table frfom my local csv file
\copy shareholders_stage(acno, name, phoneNumber, holdings, address, email, chn, rin, created_at) FROM 'C:/Users/fadebowale/Desktop/APEL-WEBSITE/sahco_reg2.csv' DELIMITER ',' CSV HEADER;

# make sure it is on a single line because it is a \copy command in psql  then run the command
# after that run the command below to insert the data from the temp table into the main table
s
 INSERT INTO shareholders (acno, name, phone_number, holdings, address, email, chn, rin, created_at)
SELECT
     acno,
     name,
     phoneNumber,
     holdings::numeric,
     address,
     email,
     chn,
     rin,
     created_at::timestamp
 FROM shareholders_stage
 ON CONFLICT (acno) DO NOTHING;

# make sure the column name matches also the data type you van see that i had to use "holdings::numeric" because the holdings column is of type numeric and i opened my text with "TEXT"  datatype so i had to cast it to numeric for it to work

 # then drop the temp table or not 

 DROP TABLE shareholders_stage;


# This is to update users email individually duhh,\(did this because i dont want to create an interface for this so there you go)
UPDATE shareholders 
SET email = 'nornahawoh@gmail.com'
WHERE email = 'nornahawohu@yahoo.com';

UPDATE shareholders 
SET phone_number = '08106406404'
WHERE phone_number = '+2348121635382';




 