import {GraphQLNonNull, GraphQLObjectType, GraphQLSchema} from 'graphql'
import {connectionArgs, cursorToOffset, offsetToCursor} from 'graphql-relay'
import prisma from '../db'
import {Context} from './context'
import {ActivateUserMutation, CreateUserMutation, SuspendUserMutation} from './mutations'
import {UserConnectionType} from './types/UserConnectionType'
import {UserType} from './types/UserType'

const mutation = new GraphQLObjectType<any, Context>({
  name: 'Mutation',
  fields: {
    createUser: CreateUserMutation,
    suspendUser: SuspendUserMutation,
    activateUser: ActivateUserMutation
  }
})

const query = new GraphQLObjectType<any, Context>({
  name: 'Query',
  fields: {
    viewer: {
      type: new GraphQLNonNull(UserType),
      resolve: (_parent, _args, contextValue) => contextValue.currentUser
    },
    users: {
      type: UserConnectionType,
      args: connectionArgs,
      resolve: async (_parent, args, contextValue) => {
        const currentUser = await contextValue.currentUser

        if (currentUser.role === 'ADMIN') {
          const first = args.first ?? 10

          const usersPlusOne = await prisma.user.findMany({
            take: first + 1,
            skip: args.after ? cursorToOffset(args.after) : undefined,
            orderBy: {
              id: 'asc'
            }
          })

          const users = usersPlusOne.slice(0, first)
          const hasNextPage = usersPlusOne.length > first
          const startCursor = users.length > 0 ? offsetToCursor(users[0].id) : null
          const endCursor = users.length > 0 ? offsetToCursor(users[users.length - 1].id) : null

          const totalCount = await prisma.user.count()

          return {
            edges: users.map(user => ({
              cursor: offsetToCursor(user.id),
              node: user
            })),
            totalCount,
            pageInfo: {
              startCursor,
              endCursor,
              hasPreviousPage: false,
              hasNextPage
            }
          }
        } else {
          const users = await prisma.user.findMany({
            where: {
              id: currentUser.id
            },
            orderBy: {
              id: 'asc'
            }
          })

          return {
            edges: users.map(user => ({
              cursor: offsetToCursor(user.id),
              node: user
            })),
            totalCount: 0,
            pageInfo: {
              startCursor: offsetToCursor(users[0].id),
              endCursor: offsetToCursor(users[0].id),
              hasPreviousPage: false,
              hasNextPage: false
            }
          }
        }
      }
    }
  }
})

export const schema = new GraphQLSchema({query, mutation})
