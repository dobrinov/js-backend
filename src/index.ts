import { fastify, FastifyInstance, RouteShorthandOptions } from "fastify";
import { IncomingMessage, Server, ServerResponse } from "http";

const server: FastifyInstance<Server, IncomingMessage, ServerResponse> =
  fastify({});

const opts: RouteShorthandOptions = {
  schema: {
    response: {
      200: {
        type: "object",
        properties: {
          pong: {
            type: "string",
          },
        },
      },
    },
  },
};

server.get("/ping", opts, (request, reply) => {
  reply.code(200).send({ pong: "pong!" });
});

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
