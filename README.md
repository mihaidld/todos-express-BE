# todos-express-BE

_to be used with todos-FE https://github.com/mihaidld/todos-FE for front-end side_

## 1. In command line start PostgreSQL database server

```bash
sudo service postgresql start
```

## 2. In PostgreSQL create `user` and `database`

```sql
postgres=> CREATE ROLE db_user WITH LOGIN PASSWORD 'strongpassword123';
postgres=> ALTER ROLE db_user CREATEDB;
postgres=> CREATE DATABASE db_api;
postgres=> \c db_api;
You are now connected to database "db_api" as user "db_user".
db_api=>SELECT * FROM todos;
db_api=>SELECT * FROM users;
```

## 3. Update `local IP` in api-server.js

## 4. Start express server via terminal command line

```bash
node src/api-server.js
```
