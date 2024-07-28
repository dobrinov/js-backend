# JS BACKEND

You can use this project as a starting point for your Node GraphQL backend.

### Getting started
```
npm install
npm start dev
```

#### Executing a GraphQL operation
```bash
curl http://localhost:8080/graph \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "...", "variables": {...}}'
```

#### GraphiQL
```
open http://localhost:8080/graphiql
```
