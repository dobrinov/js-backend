import { fastify, FastifyInstance } from "fastify";
import { readFileSync } from "fs";
import { graphql } from "graphql";
import { IncomingMessage, Server, ServerResponse } from "http";
import { schema } from "./graphql/schema";

const GRAPHIQL = readFileSync("public/graphiql.html");

const server: FastifyInstance<Server, IncomingMessage, ServerResponse> =
  fastify({ logger: true });

server.post<{
  Body: {
    query: string;
    variables?: { [variable: string]: unknown } | null | undefined;
  };
}>("/graph", async function (request, response) {
  const query = request.body.query;

  try {
    const result = await graphql({
      schema,
      source: query,
      variableValues: request.body.variables,
    });
    return response.send(result);
  } catch (error) {
    let message =
      error instanceof Error ? error.message : "Oops something went wrong";
    return response.code(500).send(message);
  }
});

server.get("/graphiql", async function (_request, response) {
  response.type("text/html").send(GRAPHIQL);
});

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
