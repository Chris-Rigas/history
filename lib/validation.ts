import { z } from 'zod';
import { IMPORTANCE_LEVELS, MAX_YEAR, MIN_YEAR } from './constants';

const optionalTrimmedString = (options?: { maxLength?: number }) =>
  z
    .string()
    .optional()
    .nullable()
    .transform(value => {
      if (value === undefined || value === null) {
        return null;
      }
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        return null;
      }
      return trimmed;
    })
    .refine(value => {
      if (value === null) {
        return true;
      }
      if (options?.maxLength) {
        return value.length <= options.maxLength;
      }
      return true;
    }, options?.maxLength ? { message: `Must be ${options.maxLength} characters or fewer` } : undefined);

const timelineSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(255),
    slug: z.string().trim().min(1, 'Slug is required').max(255),
    start_year: z
      .number()
      .int('Start year must be an integer')
      .gte(MIN_YEAR, `Start year must be after ${MIN_YEAR}`)
      .lte(MAX_YEAR, `Start year must be before ${MAX_YEAR}`),
    end_year: z
      .number()
      .int('End year must be an integer')
      .gte(MIN_YEAR, `End year must be after ${MIN_YEAR}`)
      .lte(MAX_YEAR, `End year must be before ${MAX_YEAR}`),
    region: optionalTrimmedString({ maxLength: 255 }),
    summary: optionalTrimmedString({ maxLength: 5000 }),
  })
  .refine(data => data.end_year >= data.start_year, {
    message: 'End year must be greater than or equal to start year',
    path: ['end_year'],
  });

const eventSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(255),
    slug: z.string().trim().min(1, 'Slug is required').max(255),
    start_year: z
      .number()
      .int('Start year must be an integer')
      .gte(MIN_YEAR, `Start year must be after ${MIN_YEAR}`)
      .lte(MAX_YEAR, `Start year must be before ${MAX_YEAR}`),
    end_year: z
      .number()
      .int('End year must be an integer')
      .gte(MIN_YEAR, `End year must be after ${MIN_YEAR}`)
      .lte(MAX_YEAR, `End year must be before ${MAX_YEAR}`)
      .nullable()
      .optional(),
    location: optionalTrimmedString({ maxLength: 255 }),
    type: optionalTrimmedString({ maxLength: 100 }),
    tags: z
      .array(z.string().trim().min(1, 'Tag cannot be empty').max(50))
      .optional()
      .transform(value => value ?? []),
    importance: z
      .number()
      .int('Importance must be an integer')
      .min(IMPORTANCE_LEVELS.NOTABLE)
      .max(IMPORTANCE_LEVELS.MAJOR)
      .nullable()
      .optional(),
    summary: optionalTrimmedString({ maxLength: 5000 }),
    description_html: optionalTrimmedString(),
    significance_html: optionalTrimmedString(),
  })
  .superRefine((data, ctx) => {
    if (data.end_year !== undefined && data.end_year !== null && data.end_year < data.start_year) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End year must be greater than or equal to start year',
        path: ['end_year'],
      });
    }
  });

const personSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(255),
    slug: z.string().trim().min(1, 'Slug is required').max(255),
    birth_year: z
      .number()
      .int('Birth year must be an integer')
      .gte(MIN_YEAR, `Birth year must be after ${MIN_YEAR}`)
      .lte(MAX_YEAR, `Birth year must be before ${MAX_YEAR}`)
      .nullable()
      .optional(),
    death_year: z
      .number()
      .int('Death year must be an integer')
      .gte(MIN_YEAR, `Death year must be after ${MIN_YEAR}`)
      .lte(MAX_YEAR, `Death year must be before ${MAX_YEAR}`)
      .nullable()
      .optional(),
    bio_short: optionalTrimmedString({ maxLength: 2000 }),
    bio_long: optionalTrimmedString(),
  })
  .superRefine((data, ctx) => {
    if (
      data.birth_year !== undefined &&
      data.birth_year !== null &&
      data.death_year !== undefined &&
      data.death_year !== null &&
      data.death_year < data.birth_year
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Death year must be greater than or equal to birth year',
        path: ['death_year'],
      });
    }
  });

export type TimelineValidationInput = z.infer<typeof timelineSchema>;
export type EventValidationInput = z.infer<typeof eventSchema>;
export type PersonValidationInput = z.infer<typeof personSchema>;

export function validateTimeline(data: unknown): TimelineValidationInput {
  return timelineSchema.parse(data);
}

export function validateEvent(data: unknown): EventValidationInput {
  return eventSchema.parse(data);
}

export function validatePerson(data: unknown): PersonValidationInput {
  return personSchema.parse(data);
}
