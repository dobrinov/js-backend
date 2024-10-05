import {GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString} from 'graphql'
import {Context} from '../context'
import {PageInfoType} from './PageInfoType'
import {UserType} from './UserType'

export const UserConnectionType = new GraphQLNonNull(
  new GraphQLObjectType<any, Context>({
    name: 'UserConnection',
    fields: {
      edges: {
        type: new GraphQLNonNull(
          new GraphQLList(
            new GraphQLNonNull(
              new GraphQLObjectType<any, Context>({
                name: 'UserEdge',
                fields: {
                  cursor: {type: new GraphQLNonNull(GraphQLString)},
                  node: {type: new GraphQLNonNull(UserType)}
                }
              })
            )
          )
        )
      },
      totalCount: {type: new GraphQLNonNull(GraphQLInt)},
      pageInfo: {type: new GraphQLNonNull(PageInfoType)}
    }
  })
)
