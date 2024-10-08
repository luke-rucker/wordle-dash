import { countryCodes } from '@/lib/utils'
import type { Alpha2Code } from 'i18n-iso-countries'
import {
  Enum,
  Output,
  enumType,
  maxLength,
  minLength,
  object,
  regex,
  string,
} from 'valibot'

export const anonProfileSchema = object({
  username: string('A username is required', [
    minLength(2, 'Needs to be at least 2 characters'),
    maxLength(20, 'Cannot be more than 20 characters'),
  ]),
})

export type AnonProfileData = Output<typeof anonProfileSchema>

export const profileSchema = object({
  username: string('A username is required', [
    minLength(2, 'Needs to be at least 2 characters'),
    maxLength(20, 'Cannot be more than 20 characters'),
    regex(
      /^[a-zA-Z0-9-_]+$/,
      'Must only include letters, numbers, dashes, and underscores'
    ),
  ]),
  country: enumType<Alpha2Code, Enum<Alpha2Code>>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    countryCodes as any,
    'Must be a valid country'
  ),
})

export type ProfileData = Output<typeof profileSchema>
