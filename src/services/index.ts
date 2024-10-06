export type FieldError<T> = {field: keyof T; message: string}

export type Result<T, Input> = Promise<
  {data: T} | {error: string} | {fieldErrors: FieldError<Input>[]} | {error: string; fieldErrors: FieldError<Input>[]}
>

export {createUser} from './createUser'
