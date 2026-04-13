# Kysely Example -- Northwind API

A modern, production-style REST API demonstrating [Kysely](https://github.com/kysely-org/kysely) with a [Northwind Traders](https://en.wikipedia.org/wiki/Northwind_Traders)-inspired schema.

## Stack

| Layer | Choice |
|-------|--------|
| Runtime | Node.js (ESM) |
| Web framework | [Hono](https://hono.dev) |
| Database | PostgreSQL via Kysely |
| Validation | [Zod](https://zod.dev) |
| Auth | [jose](https://github.com/panva/jose) (JWT) |
| Testing | [Vitest](https://vitest.dev) |
| TypeScript | 5.x (strict) |

## Architecture

The server follows a three-layer pattern:

1. **Repository** -- all Kysely queries live here. Each entity has a repository that
   returns typed rows and throws `AppError` on missing records.

2. **Routes** -- define the HTTP API using Hono. Routes validate input with Zod
   schemas, call repositories, and return JSON responses.

3. **Middleware** -- cross-cutting concerns like authentication and error handling.

## Schema

Four tables inspired by the classic Northwind database:

- **customer** -- name, email, city
- **product** -- name, unit price, stock, discontinued flag
- **order** -- belongs to a customer, has an order date and optional shipped date
- **order_line** -- joins an order to products with quantity and price snapshot

## Getting started

```bash
# Start PostgreSQL
docker compose up -d

# Install dependencies
npm install

# Run migrations
npm run migrate

# Copy env file (defaults work with docker compose)
cp .env.example .env

# Start the dev server
npm run dev
```

The server starts at `http://localhost:3000`. A health check is available at `GET /health`.

## API

All endpoints except `/auth/login` and `/health` require a `Bearer` token.

### Auth

```
POST /auth/login   { "email": "..." }  -->  { "token": "..." }
```

### Customers

```
GET    /customers
GET    /customers/:id
POST   /customers      { "name": "...", "email": "...", "city": "..." }
PATCH  /customers/:id  { "name": "..." }
DELETE /customers/:id
```

### Products

```
GET    /products
GET    /products/:id
POST   /products       { "name": "...", "unit_price": 9.99, "units_in_stock": 10 }
PATCH  /products/:id   { "unit_price": 12.99 }
DELETE /products/:id
```

### Orders

```
GET    /orders
GET    /orders/:id     (includes line items with product names)
POST   /orders         { "customer_id": 1, "lines": [{ "product_id": 1, "quantity": 2, "unit_price": 9.99 }] }
```

## Tests

Tests require a running PostgreSQL instance (same docker compose setup). They
create an isolated `northwind_test` database for each run.

```bash
npm test
```
