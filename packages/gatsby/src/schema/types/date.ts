import parse from "date-fns/parse"
import parseISO from "date-fns/parseISO"
import format from "date-fns/format"
import isDateFns from "date-fns/isDate"
import isValid from "date-fns/isValid"
import formatDistanceToNow from "date-fns/formatDistanceToNow"
import differenceInYears from "date-fns/differenceInYears"
import differenceInQuarters from "date-fns/differenceInQuarters"
import differenceInMonths from "date-fns/differenceInMonths"
import differenceInWeeks from "date-fns/differenceInWeeks"
import differenceInDays from "date-fns/differenceInDays"
import differenceInHours from "date-fns/differenceInHours"
import differenceInMinutes from "date-fns/differenceInMinutes"
import differenceInSeconds from "date-fns/differenceInSeconds"
import differenceInMilliseconds from "date-fns/differenceInMilliseconds"
import { GraphQLScalarType, Kind, GraphQLFieldConfig } from "graphql"
import { oneLine } from "common-tags"
import * as locales from "date-fns/locale"
import { addMinutes } from "date-fns"

type Difference =
  | "quarter"
  | "quarters"
  | "Q"
  | "year"
  | "years"
  | "y"
  | "month"
  | "months"
  | "M"
  | "week"
  | "weeks"
  | "w"
  | "day"
  | "days"
  | "d"
  | "hour"
  | "hours"
  | "h"
  | "minute"
  | "minutes"
  | "m"
  | "second"
  | "seconds"
  | "s"
  | "millisecond"
  | "milliseconds"
  | "ms"

interface IFormatDateArgs {
  date?: Date
  fromNow?: boolean
  formatString?: string
  difference?: Difference
  locale?: string
}
interface IDateResolverOption {
  locale?: string
  formatString?: string
  fromNow?: string
  difference?: string
  from?: string
  fromNode?: { type: string; defaultValue: boolean }
}
type DateResolverFieldConfig = GraphQLFieldConfig<any, any, any>
type DateResolver = (
  source: any,
  args: any,
  context: any,
  info: any
) => Promise<null | string | number | Array<string | number>>

const ISO_8601_FORMAT = [
  `YYYY`,
  `YYYY-MM`,
  `YYYY-MM-DD`,
  `YYYYMMDD`,

  // Local Time
  `YYYY-MM-DDTHH`,
  `YYYY-MM-DDTHH:mm`,
  `YYYY-MM-DDTHHmm`,
  `YYYY-MM-DDTHH:mm:ss`,
  `YYYY-MM-DDTHHmmss`,
  `YYYY-MM-DDTHH:mm:ss.SSS`,
  `YYYY-MM-DDTHHmmss.SSS`,
  `YYYY-MM-DDTHH:mm:ss.SSSSSS`,
  `YYYY-MM-DDTHHmmss.SSSSSS`,
  `YYYY-MM-DDTHH:mm:ss.SSSSSSSSS`,
  // `YYYY-MM-DDTHHmmss.SSSSSSSSS`,

  // Local Time (Omit T)
  `YYYY-MM-DD HH`,
  `YYYY-MM-DD HH:mm`,
  `YYYY-MM-DD HHmm`,
  `YYYY-MM-DD HH:mm:ss`,
  `YYYY-MM-DD HHmmss`,
  `YYYY-MM-DD HH:mm:ss.SSS`,
  `YYYY-MM-DD HHmmss.SSS`,
  `YYYY-MM-DD HH:mm:ss.SSSSSS`,
  `YYYY-MM-DD HHmmss.SSSSSS`,
  `YYYY-MM-DD HH:mm:ss.SSSSSSSSS`,
  // `YYYY-MM-DD HHmmss.SSSSSSSSS`,

  // Coordinated Universal Time (UTC)
  `YYYY-MM-DDTHHZ`,
  `YYYY-MM-DDTHH:mmZ`,
  `YYYY-MM-DDTHHmmZ`,
  `YYYY-MM-DDTHH:mm:ssZ`,
  `YYYY-MM-DDTHHmmssZ`,
  `YYYY-MM-DDTHH:mm:ss.SSSZ`,
  `YYYY-MM-DDTHHmmss.SSSZ`,
  `YYYY-MM-DDTHH:mm:ss.SSSSSSZ`,
  `YYYY-MM-DDTHHmmss.SSSSSSZ`,
  // `YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ`,
  // `YYYY-MM-DDTHHmmss.SSSSSSSSSZ`,

  // Coordinated Universal Time (UTC) (Omit T)
  `YYYY-MM-DD HHZ`,
  `YYYY-MM-DD HH:mmZ`,
  `YYYY-MM-DD HHmmZ`,
  `YYYY-MM-DD HH:mm:ssZ`,
  `YYYY-MM-DD HHmmssZ`,
  `YYYY-MM-DD HH:mm:ss.SSSZ`,
  `YYYY-MM-DD HHmmss.SSSZ`,
  `YYYY-MM-DD HH:mm:ss.SSSSSSZ`,
  `YYYY-MM-DD HHmmss.SSSSSSZ`,
  // `YYYY-MM-DD HH:mm:ss.SSSSSSSSSZ`,
  // `YYYY-MM-DD HHmmss.SSSSSSSSSZ`,

  // Coordinated Universal Time (UTC) (Omit T, Extra Space before Z)
  `YYYY-MM-DD HH Z`,
  `YYYY-MM-DD HH:mm Z`,
  `YYYY-MM-DD HHmm Z`,
  `YYYY-MM-DD HH:mm:ss Z`,
  `YYYY-MM-DD HHmmss Z`,
  `YYYY-MM-DD HH:mm:ss.SSS Z`,
  `YYYY-MM-DD HHmmss.SSS Z`,
  `YYYY-MM-DD HH:mm:ss.SSSSSS Z`,
  `YYYY-MM-DD HHmmss.SSSSSS Z`,
  `YYYY-MM-DD HH:mm:ss.SSSSSSSSS Z`,
  `YYYY-MM-DD HHmmss.SSSSSSSSS Z`,

  `YYYY-[W]WW`,
  `YYYY[W]WW`,
  `YYYY-[W]WW-E`,
  `YYYY[W]WWE`,
  `YYYY-DDDD`,
  `YYYYDDDD`,
]

// ref: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
const toSimpleUnicodeToken = (formatString: string): string =>
  [`YYYY`, `YY`, `DD`, `D`].reduce(
    (acc, target) =>
      acc.replace(new RegExp(target, `g`), target.toLocaleLowerCase()),
    formatString
  )

const SIMPLIFIED_ISO_8601_FORMAT = ISO_8601_FORMAT.map(toSimpleUnicodeToken)

export const GraphQLDate = new GraphQLScalarType({
  name: `Date`,
  description: oneLine`
    A date string, such as 2007-12-03, compliant with the ISO 8601 standard
    for representation of dates and times using the Gregorian calendar.`,
  serialize: String,
  parseValue: String,
  parseLiteral(ast): string | undefined {
    return ast.kind === Kind.STRING ? ast.value : undefined
  },
})

const momentFormattingTokens = /(\[[^[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g
const momentFormattingRegexes = {
  YYYY: `\\d{4}`,
  MM: `\\d{2}`,
  DD: `\\d{2}`,
  DDDD: `\\d{4}`,
  HH: `\\d{2}`,
  mm: `\\d{2}`,
  ss: `\\d{2}`,
  SSS: `\\d{3}`,
  SSSSSS: `\\d{6}`,
  E: `\\d`,
  W: `\\d`,
  WW: `\\d{2}`,
  "[W]": `W`,
  ".": `\\.`,
  Z: `(Z|[+-]\\d\\d(?::?\\d\\d)?)`,
}
const ISO_8601_FORMAT_AS_REGEX = ISO_8601_FORMAT.map(format => {
  const matchedFormat = format.match(momentFormattingTokens)
  if (matchedFormat === null) return ``
  // convert ISO string to a map of momentTokens ([YYYY, MM, DD])
  return [...matchedFormat]
    .map(token =>
      // see if the token (YYYY or ss) is found, else we just return the value
      momentFormattingRegexes[token] ? momentFormattingRegexes[token] : token
    )
    .join(``)
}).join(`|`)

// calculate all lengths of the formats, if a string is longer or smaller it can't be valid
const ISO_8601_FORMAT_LENGTHS = [
  ...new Set(
    ISO_8601_FORMAT.reduce((acc: Array<number>, val: string) => {
      if (!val.endsWith(`Z`)) {
        return acc.concat(val.length)
      }

      // we add count of +01 & +01:00
      return acc.concat([val.length, val.length + 3, val.length + 5])
    }, [])
  ),
]

// lets imagine these formats: YYYY-MM-DDTHH & YYYY-MM-DD HHmmss.SSSSSS Z
// this regex looks like (/^(\d{4}-\d{2}-\d{2}T\d{2}|\d{4}-\d{2}-\d{2} \d{2}\d{2}\d{2}.\d{6} Z)$)
const quickDateValidateRegex = new RegExp(`^(${ISO_8601_FORMAT_AS_REGEX})$`)

const looksLikeDateStartRegex = /^\d{4}/
// this regex makes sure the last characters are a number or the letter Z
const looksLikeDateEndRegex = /(\d|Z)$/

const baseDateInstance = new Date()

const _parse = (value: string): Date => {
  if (isValid(parseISO(value as string))) {
    return parseISO(value)
  }
  let date: Date | undefined = undefined
  SIMPLIFIED_ISO_8601_FORMAT.some((formatString: string) => {
    date = parse(
      value as string,
      formatString.replace(/T/, `'T'`).replace(/Z$/, `'Z'`),
      baseDateInstance
    )
    return isValid(date)
  })
  return date!
}

const invalidISOFormats = (value: Date | string): boolean => {
  if (isDateFns(value)) {
    return true
  }
  return !!isValid(_parse(value as string))
}

/**
 * looksLikeADate isn't a 100% valid check if it is a real date but at least it's something that looks like a date.
 * It won't catch values like 2010-02-30
 * 1) is it a number?
 * 2) does the length of the value comply with any of our formats
 * 3) does the str starts with 4 digites (YYYY)
 * 4) does the str ends with something that looks like a date
 * 5) Small regex to see if it matches any of the formats
 * 6) check momentjs
 *
 * @param {*} value
 * @return {boolean}
 */
export function looksLikeADate(value?: string): boolean {
  // quick check if value does not look like a date
  if (
    !value ||
    (value.length && !ISO_8601_FORMAT_LENGTHS.includes(value.length)) ||
    !looksLikeDateStartRegex.test(value) ||
    !looksLikeDateEndRegex.test(value)
  ) {
    return false
  }

  // If it looks like a date we parse the date with a regex to see if we can handle it.
  // momentjs just does regex validation itself if you don't do any operations on it.
  if (typeof value === `string` && quickDateValidateRegex.test(value)) {
    return true
  }

  return isDate(value)
}

/**
 * @param {*} value
 * @return {boolean}
 */
export function isDate(value: Date | string | number): boolean {
  return typeof value !== `number` && invalidISOFormats(value)
}

const getDiff = (date: Date, difference: Difference): number => {
  switch (difference) {
    case `quarter`:
    case `quarters`:
    case `Q`:
      return differenceInQuarters(new Date(), date)
    case `year`:
    case `years`:
    case `y`:
      return differenceInYears(new Date(), date)
    case `month`:
    case `months`:
    case `M`:
      return differenceInMonths(new Date(), date)
    case `week`:
    case `weeks`:
    case `w`:
      return differenceInWeeks(new Date(), date)
    case `day`:
    case `days`:
    case `d`:
      return differenceInDays(new Date(), date)
    case `hour`:
    case `hours`:
    case `h`:
      return differenceInHours(new Date(), date)
    case `minute`:
    case `minutes`:
    case `m`:
      return differenceInMinutes(new Date(), date)
    case `second`:
    case `seconds`:
    case `s`:
      return differenceInSeconds(new Date(), date)
    case `milliseconds`:
    case `millisecond`:
    case `ms`:
      return differenceInMilliseconds(new Date(), date)
    default:
      return 0
  }
}

const formatDate = ({
  date,
  fromNow,
  difference,
  formatString,
  locale = `en-US`,
}: IFormatDateArgs): string | number => {
  const normalizedDate = JSON.parse(JSON.stringify(date))
  const parsedDate = _parse(normalizedDate)
  if (!parsedDate) {
    return normalizedDate
  }
  if (!isValid(parsedDate)) {
    return parsedDate.toLocaleString() // return Invalid Date
  }

  const utc = addMinutes(parsedDate, parsedDate.getTimezoneOffset())
  if (formatString) {
    return format(utc, toSimpleUnicodeToken(formatString), {
      locale: locales[locale],
    })
  } else if (fromNow) {
    return formatDistanceToNow(utc, { locale: locales[locale] })
  } else if (difference) {
    return getDiff(utc, difference)
  }
  return normalizedDate
}

export const getDateResolver = (
  options: IDateResolverOption = {},
  fieldConfig: DateResolverFieldConfig
): { args: Record<string, any>; resolve: DateResolver } => {
  const { locale, formatString, fromNow, difference } = options
  return {
    args: {
      ...fieldConfig.args,
      formatString: {
        type: `String`,
        description: oneLine`
        Format the date using Moment.js' date tokens, e.g.
        \`date(formatString: "YYYY MMMM DD")\`.
        See https://momentjs.com/docs/#/displaying/format/
        for documentation for different tokens.`,
        defaultValue: formatString,
      },
      fromNow: {
        type: `Boolean`,
        description: oneLine`
        Returns a string generated with Moment.js' \`fromNow\` function`,
        defaultValue: fromNow,
      },
      difference: {
        type: `String`,
        description: oneLine`
        Returns the difference between this date and the current time.
        Defaults to "milliseconds" but you can also pass in as the
        measurement "years", "months", "weeks", "days", "hours", "minutes",
        and "seconds".`,
        defaultValue: difference,
      },
      locale: {
        type: `String`,
        description: oneLine`
        Configures the locale Moment.js will use to format the date.`,
        defaultValue: locale,
      },
    },
    async resolve(source, args, context, info): ReturnType<DateResolver> {
      const resolver = fieldConfig.resolve || context.defaultFieldResolver
      const date = await resolver(source, args, context, {
        ...info,
        from: options.from || info.from,
        fromNode: options.from ? options.fromNode : info.fromNode,
      })
      if (date == null) return null

      return Array.isArray(date)
        ? date.map(d => formatDate({ date: d, ...args }))
        : formatDate({ date, ...args })
    },
  }
}
