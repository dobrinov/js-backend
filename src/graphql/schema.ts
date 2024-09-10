import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from "graphql";
import { connectionArgs, cursorToOffset, offsetToCursor } from "graphql-relay";
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
    suspendedAt: { type: GraphQLString },
  },
});

const pageInfo = new GraphQLObjectType({
  name: "PageInfo",
  fields: {
    startCursor: { type: GraphQLString },
    endCursor: { type: GraphQLString },
    hasPreviousPage: { type: new GraphQLNonNull(GraphQLString) },
    hasNextPage: { type: new GraphQLNonNull(GraphQLString) },
  },
});

const userEdge = new GraphQLObjectType({
  name: "UserEdge",
  fields: {
    cursor: { type: new GraphQLNonNull(GraphQLString) },
    node: { type: new GraphQLNonNull(user) },
  },
});

const userConnection = new GraphQLNonNull(
  new GraphQLObjectType({
    name: "UserConnection",
    fields: {
      edges: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(userEdge))),
      },
      pageInfo: { type: new GraphQLNonNull(pageInfo) },
    },
  })
);

const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    suspendUser: {
      type: new GraphQLObjectType({
        name: "suspendUserPayload",
        fields: {
          user: { type: user },
        },
      }),
      args: { userId: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (_parent, args, contextValue) => {
        const currentUser = await contextValue.currentUser;

        if (currentUser.role !== "ADMIN") throw new Error("Unauthorized");

        const user = await prisma.user.update({
          where: {
            id: parseInt(args.userId), // Use Relay ID here
          },
          data: {
            suspendedAt: new Date(),
          },
        });

        return { user };
      },
    },
    activateUser: {
      type: new GraphQLObjectType({
        name: "activateUserPayload",
        fields: {
          user: { type: user },
        },
      }),
      args: { userId: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (_parent, args, contextValue) => {
        const currentUser = await contextValue.currentUser;

        if (currentUser.role !== "ADMIN") {
          throw new Error("Unauthorized");
        }

        const user = await prisma.user.update({
          where: {
            id: parseInt(args.userId),
          },
          data: {
            suspendedAt: null,
          },
        });

        return { user };
      },
    },
  },
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
        type: userConnection,
        args: connectionArgs,
        resolve: async (_parent, args, contextValue) => {
          const currentUser = await contextValue.currentUser;

          if (currentUser.role === "ADMIN") {
            const first = args.first ?? 10;

            const usersPlusOne = await prisma.user.findMany({
              take: first + 1,
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
          } else {
            const users = await prisma.user.findMany({
              where: {
                id: currentUser.id,
              },
              orderBy: {
                id: "asc",
              },
            });

            return {
              edges: users.map((user) => ({
                cursor: offsetToCursor(user.id),
                node: user,
              })),
              pageInfo: {
                startCursor: offsetToCursor(users[0].id),
                endCursor: offsetToCursor(users[0].id),
                hasPreviousPage: false,
                hasNextPage: false,
              },
            };
          }
        },
      },
    },
  }),
  mutation: Mutation,
});
