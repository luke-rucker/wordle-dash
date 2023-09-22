import { Output, maxLength, minLength, object, regex, string } from 'valibot'

export const anonProfileSchema = object({
  username: string('A username is required', [
    minLength(3, 'Needs to be at least 3 characters'),
    maxLength(24, 'Cannot be more than 24 characters'),
  ]),
})

export type AnonProfileData = Output<typeof anonProfileSchema>

export const profileSchema = object({
  username: string('A username is required', [
    minLength(3, 'Needs to be at least 3 characters'),
    maxLength(24, 'Cannot be more than 24 characters'),
    regex(
      /^[a-zA-Z0-9-_]+$/,
      'Must only include letters, numbers, dashes, and underscores'
    ),
  ]),
})

export type ProfileData = Output<typeof profileSchema>
