import cors from "@fastify/cors";
import "dotenv/config";
import { fastify, FastifyInstance } from "fastify";
import { readFileSync } from "fs";
import { graphql } from "graphql";
import { IncomingMessage, Server, ServerResponse } from "http";
import * as jose from "jose";
import prisma from "./db";
import { schema } from "./graphql/schema";
import { checkPassword } from "./util/password";

const GRAPHIQL = readFileSync("graphiql.html");

async function encodeJWT(userId: number, shadowingUserId?: number) {
  const alg = "HS256";
  const secret = process.env.JWT_SECRET;

  if (!secret) throw new Error("JWT secret is not set in this environment");

  return new jose.SignJWT({ userId, shadowingUserId })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(new TextEncoder().encode(secret));
}

async function decodeJWT(token: string) {
  let claims: jose.JWTPayload;
  try {
    claims = jose.decodeJwt(token);
  } catch {
    return { error: "Invalid token" };
  }

  if (!claims) return { error: "Invalid token" };

  if (!("userId" in claims) || typeof claims.userId !== "number")
    return { error: "Invalid token" };

  const user = await prisma.user.findUnique({ where: { id: claims.userId } });

  if (!user) return { error: "Cannot find user" };

  if (!("exp" in claims) || typeof claims.exp !== "number")
    return { error: "Invalid token" };

  if (claims.exp * 1000 < Date.now()) return { error: "Token expired" };

  const shadowingUserId =
    "shadowingUserId" in claims && typeof claims.shadowingUserId === "number"
      ? claims.shadowingUserId
      : undefined;

  return { user, shadowingUserId };
}

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
    const { user, error } = await decodeJWT(token);

    if (error) return response.code(401).send(errorResponseBody(error));

    try {
      const result = await graphql({
        schema,
        source: query,
        contextValue: { currentUser: user },
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
      const { email, password } = request.body;

      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) return response.code(401).send("Invalid email or password");

      if (!checkPassword(password, user.passwordDigest))
        return response.code(401).send("Invalid email or password");

      const jwt = await encodeJWT(user.id);

      response.header("Access-Control-Allow-Origin", "*");
      response.header("Access-Control-Allow-Methods", "POST");
      response.send(jwt);
    }
  );

  server.post<{ Body: { userId: string } }>(
    "/impersonate",
    async function (request, response) {
      const authorization = request.headers.authorization;

      if (!authorization)
        return response.code(401).send(errorResponseBody("Unauthorized"));

      const token = authorization.replace("Bearer ", "");
      const { user, error } = await decodeJWT(token);

      if (!user)
        return response.code(401).send(errorResponseBody("Unauthorized"));
      if (error) return response.code(401).send(errorResponseBody(error));

      const { userId } = request.body;

      if (parseInt(userId) === user.id)
        return response
          .code(400)
          .send(errorResponseBody("Cannot impersonate yourself"));

      const jwt = await encodeJWT(parseInt(userId), user.id);

      response.header("Access-Control-Allow-Origin", "*");
      response.header("Access-Control-Allow-Methods", "POST");
      response.send(jwt);
    }
  );

  server.delete("/unimpersonate", async function (request, response) {
    const authorization = request.headers.authorization;

    if (!authorization)
      return response.code(401).send(errorResponseBody("Unauthorized"));

    const token = authorization.replace("Bearer ", "");
    const { shadowingUserId, error } = await decodeJWT(token);

    if (!shadowingUserId)
      return response
        .code(401)
        .send(errorResponseBody("Not in impersonation session"));
    if (error) return response.code(401).send(errorResponseBody(error));

    const jwt = await encodeJWT(shadowingUserId);

    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Methods", "POST");
    response.send(jwt);
  });

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
