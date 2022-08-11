# todos-express-BE

_to be used with todos-FE https://github.com/mihaidld/todos-FE for front-end side_

## Features

-   back-end for TODO List app using `express` and middlewares
-   database `Postgresql`
-   connexion with `Squelize`
-   simple user registration and authentication using API Keys

## Routes

Public

-   `/register` => register a user, display generated API Key.

Requiring authentication via API Key

-   `/create` => create todo
-   `/delete/:id` => delete todo
-   `/done/:id` => change status of a todo to 'done'
-   `/undone/:id` => change status of a todo to 'undone'
-   `/list` => get all todos.

## Install

In command line start PostgreSQL database server:

```bash
sudo service postgresql start
```

In PostgreSQL create user `db_user` and database `db_api_todo`:

```sql
postgres=> CREATE ROLE db_user WITH LOGIN PASSWORD 'strongpassword123';
postgres=> ALTER ROLE db_user CREATEDB;
postgres=> CREATE DATABASE db_api_todo;
postgres=> \q;
```

```bash
psql -d db_api_todo -U db_user
```

```sql
postgres=> \c db_api_todo;
You are now connected to database "db_api_todo" as user "db_user".
```

Update `local IP` in `api-server.js` with your local IP address.

Install dependencies and start express server via terminal command line:

```bash
yarn
node src/api-server.js
```

## Usage

Create users and tasks using application then check database:

```sql
db_api_todo=>SELECT * FROM todos;
db_api_todo=>SELECT * FROM users;
```
