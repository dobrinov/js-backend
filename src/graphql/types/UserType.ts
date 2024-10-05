import {GraphQLEnumType, GraphQLNonNull, GraphQLObjectType, GraphQLString} from 'graphql'
import {Context} from '../context'

const UserRoleEnumType = new GraphQLEnumType({
  name: 'UserRole',
  values: {
    BASIC: {value: 'BASIC'},
    ADMIN: {value: 'ADMIN'}
  }
})

export const UserType = new GraphQLObjectType<any, Context>({
  name: 'User',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLString)},
    name: {type: new GraphQLNonNull(GraphQLString)},
    email: {type: new GraphQLNonNull(GraphQLString)},
    role: {type: new GraphQLNonNull(UserRoleEnumType)},
    suspendedAt: {type: GraphQLString},
    lastLoggedAt: {type: GraphQLString}
  }
})
