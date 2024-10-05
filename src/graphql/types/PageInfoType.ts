import {GraphQLNonNull, GraphQLObjectType, GraphQLString} from 'graphql'
import {Context} from '../context'

export const PageInfoType = new GraphQLObjectType<any, Context>({
  name: 'PageInfo',
  fields: {
    startCursor: {type: GraphQLString},
    endCursor: {type: GraphQLString},
    hasPreviousPage: {type: new GraphQLNonNull(GraphQLString)},
    hasNextPage: {type: new GraphQLNonNull(GraphQLString)}
  }
})
