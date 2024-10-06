import {GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString} from 'graphql'
import {Context} from '../context'

export type FailedMutation = {
  failureMessage: string
}

export type FailedMutationWithFields<T> = {
  failureMessage: string | null
  fieldFailures: {field: keyof T; message: string}[]
}

export const FieldFailureType = new GraphQLObjectType({
  name: 'FieldFailure',
  fields: {
    field: {type: new GraphQLNonNull(GraphQLString)},
    message: {type: new GraphQLNonNull(GraphQLString)}
  }
})

export const FailedMutationType = new GraphQLObjectType({
  name: 'FailedMutation',
  fields: {
    failureMessage: {type: new GraphQLNonNull(GraphQLString)}
  }
})

export const FailedMutationWithFieldsType = new GraphQLObjectType<any, Context>({
  name: 'FailedMutationWithFields',
  fields: {
    failureMessage: {type: GraphQLString},
    fieldFailures: {type: new GraphQLNonNull(new GraphQLList(FieldFailureType))}
  }
})
