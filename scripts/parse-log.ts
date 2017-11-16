import { createReadStream } from 'fs'
import { join } from 'path'
import { createInterface } from 'readline'
import * as winston from 'winston'
import { readFileBufferPromise } from '../server/helpers/core-utils'
import { CONFIG } from '../server/initializers/constants'

const label = CONFIG.WEBSERVER.HOSTNAME + ':' + CONFIG.WEBSERVER.PORT

const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      level: 'debug',
      label: label,
      handleExceptions: true,
      humanReadableUnhandledException: true,
      json: false,
      colorize: true,
      prettyPrint: true
    })
  ],
  exitOnError: true
})

const logLevels = {
  error: logger.error,
  warn: logger.warn,
  info: logger.info,
  debug: logger.debug
}

const path = join(CONFIG.STORAGE.LOG_DIR, 'all-logs.log')
console.log('Opening %s.', path)

const rl = createInterface({
  input: createReadStream(path)
})

rl.on('line', line => {
  const log = JSON.parse(line)
  logLevels[log.level](log.message)
})
