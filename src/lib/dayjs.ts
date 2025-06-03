import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat.js' // ES 2015
import isBetween from 'dayjs/plugin/isBetween.js'
import isLeapYear from 'dayjs/plugin/isLeapYear.js'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js' // ES 2015
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js' // ES 2015
import minMax from 'dayjs/plugin/minMax.js'
import timezone from 'dayjs/plugin/timezone.js'
import utc from 'dayjs/plugin/utc.js' // ES 2015
import relativeTime from 'dayjs/plugin/relativeTime.js'

dayjs.extend(customParseFormat)
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(minMax)
dayjs.extend(isLeapYear)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isBetween)
dayjs.extend(relativeTime)
const dayjsUtc = dayjs.utc
dayjs.tz.setDefault('Etc/GMT')

export const dayJs = dayjs
export { dayjs, dayjsUtc }
