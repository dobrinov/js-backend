import {User} from '@prisma/client'
import {
  GraphQLFieldConfig,
  GraphQLFieldResolver,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType
} from 'graphql'
import prisma from '../../db'
import {hashPassword} from '../../util/password'
import {Context} from '../context'
import {UserType} from '../types/UserType'
import {FailedMutationWithFields, FailedMutationWithFieldsType} from './failable-mutation'

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

const SuccessfulCreateUserPayload = new GraphQLObjectType({
  name: 'SuccessfulCreateUserPayload',
  fields: {
    user: {type: new GraphQLNonNull(UserType)}
  }
})

type CreateUserInput = {
  name: string
  email: string
  password: string
  passwordConfirmation: string
}

type SuccessPayload = {user: User}
type FailurePayload = FailedMutationWithFields<CreateUserInput>

const CreateUserPayload = new GraphQLUnionType({
  name: 'CreateUserPayload',
  types: [SuccessfulCreateUserPayload, FailedMutationWithFieldsType],
  resolveType: value => {
    if ('failureMessage' in value) {
      return 'FailedMutationWithFields'
    } else if ('user' in value) {
      return 'SuccessfulCreateUserPayload'
    } else {
      throw new Error('Unknown payload type')
    }
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
  Promise<SuccessPayload | FailurePayload>
> = async (_, {input: {name, email, password, passwordConfirmation}}, context) => {
  const currentUser = await context.currentUser

  if (currentUser.role !== 'ADMIN') throw new Error('Unauthorized')

  const fieldFailures: FailurePayload['fieldFailures'] = []
  if (!name) fieldFailures.push({field: 'name', message: 'Name is required'})
  if (!email) fieldFailures.push({field: 'email', message: 'Email is required'})
  if (!password) fieldFailures.push({field: 'password', message: 'Password is required'})
  if (!passwordConfirmation)
    fieldFailures.push({field: 'passwordConfirmation', message: 'Password confirmation is required'})

  if (fieldFailures.length > 0) return {failureMessage: null, fieldFailures}

  if (password !== passwordConfirmation) {
    return {failureMessage: 'Passwords do not match', fieldFailures: []}
  }

  const existingUser = await prisma.user.findUnique({where: {email}})
  if (existingUser) return {failureMessage: 'User exists', fieldFailures: []}

  const user = await prisma.user.create({
    data: {
      name,
      email,
      role: 'BASIC',
      passwordDigest: hashPassword(password)
    }
  })

  return {user}
}

export const CreateUserMutation: GraphQLFieldConfig<any, Context> = {
  type: CreateUserPayload,
  args: {input: {type: new GraphQLNonNull(CreateUserInputType)}},
  resolve
}
