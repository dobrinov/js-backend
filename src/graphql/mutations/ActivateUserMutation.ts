import {GraphQLFieldResolver, GraphQLID, GraphQLNonNull, GraphQLObjectType} from 'graphql'
import prisma from '../../db'
import {Context} from '../context'
import {UserType} from '../types/UserType'

const resolve: GraphQLFieldResolver<any, Context, {userId: string}, any> = async (
  _,
  {userId}: {userId: string},
  context
) => {
  const currentUser = await context.currentUser

  if (currentUser.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.update({
    where: {id: parseInt(userId)},
    data: {suspendedAt: null}
  })

  return {user}
}

export const ActivateUserMutation = {
  type: new GraphQLObjectType<any, Context>({
    name: 'activateUserPayload',
    fields: {
      user: {type: UserType}
    }
  }),
  args: {userId: {type: new GraphQLNonNull(GraphQLID)}},
  resolve
}
