import {
  GraphQLInt,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from "graphql";

export const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "QueryType",
    fields: {
      add: {
        type: GraphQLString,
        args: {
          x: { type: GraphQLInt },
          y: { type: GraphQLInt },
        },
        resolve(_source, { x, y }) {
          return x + y;
        },
      },
    },
  }),
});
