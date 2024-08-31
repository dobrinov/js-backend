# JS BACKEND

You can use this project as a starting point for your Node GraphQL backend.

### Getting started
```
npm install
npm run db:setup
npm run dev
```

#### Create a session
```bash
curl http://localhost:8080/session \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "1"}'
```

#### Executing a GraphQL operation
```bash
curl http://localhost:8080/graph \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN_GOES_HERE" \
  -d '{"query": "query { viewer { id name email } }"}'
```

#### GraphiQL
```
open http://localhost:8080/graphiql
```

This will log you in with admin@example.com. If you want to use basic@example.com:

```
open http://localhost:8080/graphiql?email=basic@example.com
```
