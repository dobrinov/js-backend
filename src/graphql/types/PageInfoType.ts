import {GraphQLBoolean, GraphQLNonNull, GraphQLObjectType, GraphQLString} from 'graphql'
import {Context} from '../context'

export const PageInfoType = new GraphQLObjectType<any, Context>({
  name: 'PageInfo',
  fields: {
    startCursor: {type: GraphQLString},
    endCursor: {type: GraphQLString},
    hasPreviousPage: {type: new GraphQLNonNull(GraphQLBoolean)},
    hasNextPage: {type: new GraphQLNonNull(GraphQLBoolean)}
  }
})
