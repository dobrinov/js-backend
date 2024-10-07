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
import {createUser} from '../../services'
import {Context} from '../context'
import {UserRoleEnumType, UserType} from '../types/UserType'
import {FailedMutationWithFields, FailedMutationWithFieldsType} from './failable-mutation'

const CreateUserInputType = new GraphQLInputObjectType({
  name: 'CreateUserInput',
  description: 'Input payload for creating user',
  fields: () => ({
    role: {type: new GraphQLNonNull(UserRoleEnumType)},
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
  role: User['role']
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
  {input: CreateUserInput},
  Promise<SuccessPayload | FailurePayload>
> = async (_, {input: {role, name, email, password, passwordConfirmation}}, context) => {
  const currentUser = await context.currentUser

  if (currentUser.role !== 'ADMIN') throw new Error('Unauthorized')

  const result = await createUser({name, role, email, password, passwordConfirmation})

  if ('data' in result) {
    return {user: result.data}
  } else {
    return {
      failureMessage: 'error' in result ? result.error : null,
      fieldFailures: 'fieldErrors' in result ? result.fieldErrors : []
    }
  }
}

export const CreateUserMutation: GraphQLFieldConfig<any, Context> = {
  type: CreateUserPayload,
  args: {input: {type: new GraphQLNonNull(CreateUserInputType)}},
  resolve
}
