import { join } from 'path'
import { flattenDepth } from 'lodash'
require('pg').defaults.parseInt8 = true // Avoid BIGINT to be converted to string
import * as Sequelize from 'sequelize'
import * as Bluebird from 'bluebird'

import { CONFIG } from './constants'
// Do not use barrel, we need to load database first
import { logger } from '../helpers/logger'
import { isTestInstance, readdirPromise } from '../helpers/core-utils'

import { VideoModel } from './../models/video/video-interface'
import { VideoTagModel } from './../models/video/video-tag-interface'
import { BlacklistedVideoModel } from './../models/video/video-blacklist-interface'
import { VideoFileModel } from './../models/video/video-file-interface'
import { VideoAbuseModel } from './../models/video/video-abuse-interface'
import { VideoChannelModel } from './../models/video/video-channel-interface'
import { UserModel } from './../models/user/user-interface'
import { UserVideoRateModel } from './../models/user/user-video-rate-interface'
import { TagModel } from './../models/video/tag-interface'
import { RequestModel } from './../models/request/request-interface'
import { RequestVideoQaduModel } from './../models/request/request-video-qadu-interface'
import { RequestVideoEventModel } from './../models/request/request-video-event-interface'
import { RequestToPodModel } from './../models/request/request-to-pod-interface'
import { PodModel } from './../models/pod/pod-interface'
import { OAuthTokenModel } from './../models/oauth/oauth-token-interface'
import { OAuthClientModel } from './../models/oauth/oauth-client-interface'
import { JobModel } from './../models/job/job-interface'
import { AuthorModel } from './../models/video/author-interface'
import { ApplicationModel } from './../models/application/application-interface'

const dbname = CONFIG.DATABASE.DBNAME
const username = CONFIG.DATABASE.USERNAME
const password = CONFIG.DATABASE.PASSWORD

const database: {
  sequelize?: Sequelize.Sequelize,
  init?: (silent: boolean) => Promise<void>,

  Application?: ApplicationModel,
  Author?: AuthorModel,
  Job?: JobModel,
  OAuthClient?: OAuthClientModel,
  OAuthToken?: OAuthTokenModel,
  Pod?: PodModel,
  RequestToPod?: RequestToPodModel,
  RequestVideoEvent?: RequestVideoEventModel,
  RequestVideoQadu?: RequestVideoQaduModel,
  Request?: RequestModel,
  Tag?: TagModel,
  UserVideoRate?: UserVideoRateModel,
  User?: UserModel,
  VideoAbuse?: VideoAbuseModel,
  VideoChannel?: VideoChannelModel,
  VideoFile?: VideoFileModel,
  BlacklistedVideo?: BlacklistedVideoModel,
  VideoTag?: VideoTagModel,
  Video?: VideoModel
} = {}

const sequelize = new Sequelize(dbname, username, password, {
  dialect: 'postgres',
  host: CONFIG.DATABASE.HOSTNAME,
  port: CONFIG.DATABASE.PORT,
  benchmark: isTestInstance(),
  isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  operatorsAliases: false,

  logging: (message: string, benchmark: number) => {
    let newMessage = message
    if (isTestInstance() === true && benchmark !== undefined) {
      newMessage += ' | ' + benchmark + 'ms'
    }

    logger.debug(newMessage)
  }
})

database.sequelize = sequelize

database.init = async (silent: boolean) => {
  const modelDirectory = join(__dirname, '..', 'models')

  const filePaths = await getModelFiles(modelDirectory)

  for (const filePath of filePaths) {
    try {
      const model = sequelize.import(filePath)

      database[model['name']] = model
    } catch (err) {
      logger.error('Cannot import database model %s.', filePath, err)
      process.exit(0)
    }
  }

  for (const modelName of Object.keys(database)) {
    if ('associate' in database[modelName]) {
      database[modelName].associate(database)
    }
  }

  if (!silent) logger.info('Database %s is ready.', dbname)

  return
}

// ---------------------------------------------------------------------------

export {
  database
}

// ---------------------------------------------------------------------------

async function getModelFiles (modelDirectory: string) {
  const files = await readdirPromise(modelDirectory)
  const directories = files.filter(directory => {
    // Find directories
    if (
      directory.endsWith('.js.map') ||
      directory === 'index.js' || directory === 'index.ts' ||
      directory === 'utils.js' || directory === 'utils.ts'
    ) return false

    return true
  })

  const tasks: Bluebird<any>[] = []

  // For each directory we read it and append model in the modelFilePaths array
  for (const directory of directories) {
    const modelDirectoryPath = join(modelDirectory, directory)

    const promise = readdirPromise(modelDirectoryPath)
      .then(files => {
        const filteredFiles = files
          .filter(file => {
            if (
              file === 'index.js' || file === 'index.ts' ||
              file === 'utils.js' || file === 'utils.ts' ||
              file.endsWith('-interface.js') || file.endsWith('-interface.ts') ||
              file.endsWith('.js.map')
            ) return false

            return true
          })
          .map(file => join(modelDirectoryPath, file))

        return filteredFiles
      })

    tasks.push(promise)
  }

  const filteredFilesArray: string[][] = await Promise.all(tasks)
  return flattenDepth<string>(filteredFilesArray, 1)
}
