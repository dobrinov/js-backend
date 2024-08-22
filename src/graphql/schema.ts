import {
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from "graphql";
import {
  connectionArgs,
  connectionDefinitions,
  cursorToOffset,
  offsetToCursor,
} from "graphql-relay";
import prisma from "../db";

const UserRoleEnumType = new GraphQLEnumType({
  name: "UserRole",
  values: {
    BASIC: { value: "BASIC" },
    ADMIN: { value: "ADMIN" },
  },
});

const user = new GraphQLObjectType({
  name: "User",
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    role: { type: new GraphQLNonNull(UserRoleEnumType) },
  },
});

var { connectionType: UserConnection } = connectionDefinitions({
  nodeType: user,
});

export const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "Query",
    fields: {
      viewer: {
        type: new GraphQLNonNull(user),
        resolve: (_parent, _args, contextValue) => contextValue.currentUser,
      },
      users: {
        type: new GraphQLNonNull(UserConnection),
        args: connectionArgs,
        resolve: async (_parent, args) => {
          const first = args.first ?? 10;

          const usersPlusOne = await prisma.user.findMany({
            take: first,
            skip: args.after ? cursorToOffset(args.after) : undefined,
            orderBy: {
              id: "asc",
            },
          });

          const users = usersPlusOne.slice(0, first);
          const hasNextPage = usersPlusOne.length > first;
          const startCursor =
            users.length > 0 ? offsetToCursor(users[0].id) : null;
          const endCursor =
            users.length > 0
              ? offsetToCursor(users[users.length - 1].id)
              : null;

          return {
            edges: users.map((user) => ({
              cursor: offsetToCursor(user.id),
              node: user,
            })),
            pageInfo: {
              startCursor,
              endCursor,
              hasPreviousPage: false,
              hasNextPage,
            },
          };
        },
      },
    },
  }),
});
