import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from "graphql";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const user = new GraphQLObjectType({
  name: "User",
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
  },
});

export const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "Query",
    fields: {
      viewer: {
        type: user,
        async resolve() {
          const users = await prisma.user.findMany();
          const user = users[0];

          return user;
        },
      },
    },
  }),
});
