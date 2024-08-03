import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import { fastify, FastifyInstance } from "fastify";
import { readFileSync } from "fs";
import { graphql } from "graphql";
import { IncomingMessage, Server, ServerResponse } from "http";
import * as jose from "jose";
import { schema } from "./graphql/schema";
import { checkPassword } from "./util/password";

const GRAPHIQL = readFileSync("graphiql.html");

async function execute() {
  const server: FastifyInstance<Server, IncomingMessage, ServerResponse> =
    fastify({ logger: true });

  await server.register(cors, {});

  server.post<{
    Body: {
      query: string;
      variables?: { [variable: string]: unknown } | null | undefined;
    };
  }>("/graph", async function (request, response) {
    const query = request.body.query;
    const authorization = request.headers.authorization;

    if (!authorization)
      return response.code(401).send(errorResponseBody("Unauthorized"));

    const token = authorization.replace("Bearer ", "");

    let claims: jose.JWTPayload;
    try {
      claims = jose.decodeJwt(token);
    } catch {
      return response.code(400).send(errorResponseBody("Invalid token"));
    }

    if (!claims)
      return response.code(400).send(errorResponseBody("Invalid token"));

    if (!("userId" in claims) || typeof claims.userId !== "number")
      return response.code(400).send(errorResponseBody("Invalid token"));

    const prisma = new PrismaClient();
    const currentUser = prisma.user.findUnique({
      where: { id: claims.userId },
    });

    if (!currentUser)
      return response.code(401).send(errorResponseBody("Unauthorized"));

    if (!("exp" in claims) || typeof claims.exp !== "number")
      return response.code(400).send(errorResponseBody("Invalid token"));

    if (claims.exp * 1000 < Date.now())
      return response.code(401).send(errorResponseBody("Token expired"));

    try {
      const result = await graphql({
        schema,
        source: query,
        contextValue: { currentUser },
        variableValues: request.body.variables,
      });
      return response.send(result);
    } catch (error) {
      let message =
        error instanceof Error ? error.message : "Oops something went wrong";
      return response.code(500).send(errorResponseBody(message));
    }
  });

  server.get("/graphiql", async function (_request, response) {
    response.type("text/html").send(GRAPHIQL);
  });

  server.post<{ Body: { email: string; password: string } }>(
    "/session",
    async function (request, response) {
      const alg = "HS256";
      const secret = process.env.JWT_SECRET;

      const { email, password } = request.body;
      const prisma = new PrismaClient();

      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) return response.code(401).send("Invalid email or password");

      if (!checkPassword(password, user.passwordDigest))
        return response.code(401).send("Invalid email or password");

      if (!secret)
        return response
          .code(500)
          .send("JWT secret is not set in this environment");

      const jwt = await new jose.SignJWT({ userId: user.id })
        .setProtectedHeader({ alg })
        .setIssuedAt()
        .setExpirationTime("2h")
        .sign(new TextEncoder().encode(secret));

      response.header("Access-Control-Allow-Origin", "*");
      response.header("Access-Control-Allow-Methods", "POST");
      response.send(jwt);
    }
  );

  server.listen({ port: 8080 }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
  });

  function errorResponseBody(error: string) {
    return {
      errors: [{ message: error }],
      data: null,
    };
  }
}

execute();
