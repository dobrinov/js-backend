import {User} from '@prisma/client'
import {FieldError, Result} from '.'
import prisma from '../db'
import {hashPassword} from '../util/password'

type Input = Pick<User, 'name' | 'role' | 'email'> & {password: string; passwordConfirmation: string}

export async function createUser({name, role, email, password, passwordConfirmation}: Input): Result<User, Input> {
  const fieldErrors: FieldError<Input>[] = []
  if (!name) fieldErrors.push({field: 'name', message: 'Name is required'})
  if (!email) fieldErrors.push({field: 'email', message: 'Email is required'})
  if (!password) fieldErrors.push({field: 'password', message: 'Password is required'})
  if (!passwordConfirmation)
    fieldErrors.push({field: 'passwordConfirmation', message: 'Password confirmation is required'})

  if (fieldErrors.length > 0) return {fieldErrors}
  if (password !== passwordConfirmation) return {error: 'Passwords do not match'}

  const existingUser = await prisma.user.findUnique({where: {email}})
  if (existingUser) return {error: 'User exists'}

  const user = await prisma.user.create({
    data: {
      name,
      email,
      role,
      passwordDigest: hashPassword(password)
    }
  })

  return {data: user}
}
