import {
  GraphQLFieldConfig,
  GraphQLFieldResolver,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'
import prisma from '../../db'
import {hashPassword} from '../../util/password'
import {Context} from '../context'
import {UserType} from '../types/UserType'

const CreateUserInputType = new GraphQLInputObjectType({
  name: 'CreateUserInput',
  description: 'Input payload for creating user',
  fields: () => ({
    name: {type: new GraphQLNonNull(GraphQLString)},
    email: {type: new GraphQLNonNull(GraphQLString)},
    password: {type: new GraphQLNonNull(GraphQLString)},
    passwordConfirmation: {type: new GraphQLNonNull(GraphQLString)}
  })
})

const CreateUserPayload = new GraphQLObjectType({
  name: 'CreateUserPayload',
  fields: {
    user: {type: UserType}
  }
})

const resolve: GraphQLFieldResolver<
  any,
  Context,
  {
    input: {
      name: string
      email: string
      password: string
      passwordConfirmation: string
    }
  },
  any
> = async (_, {input: {name, email, password, passwordConfirmation}}, context) => {
  const currentUser = await context.currentUser

  if (currentUser.role !== 'ADMIN') throw new Error('Unauthorized')

  // TODO: Ensure that the password and passwordConfirmation match
  // Return {data: {success: false, errorMessage: "Passwords do not match"}} if they don't

  const user = await prisma.user.create({
    data: {
      name,
      email,
      role: 'BASIC',
      passwordDigest: hashPassword(password)
    }
  })

  // The payload should be {data: {success: true, user}} if they don't
  return {user}
}

export const CreateUserMutation: GraphQLFieldConfig<any, Context> = {
  type: CreateUserPayload,
  args: {input: {type: new GraphQLNonNull(CreateUserInputType)}},
  resolve
}
