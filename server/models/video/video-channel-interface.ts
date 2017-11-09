import * as Sequelize from 'sequelize'
import * as Promise from 'bluebird'

import { ResultList } from '../../../shared'

// Don't use barrel, import just what we need
import { VideoChannel as FormattedVideoChannel } from '../../../shared/models/videos/video-channel.model'
import { VideoInstance } from './video-interface'
import { AccountInstance } from '../account/account-interface'
import { VideoChannelObject } from '../../../shared/models/activitypub/objects/video-channel-object'

export namespace VideoChannelMethods {
  export type ToFormattedJSON = (this: VideoChannelInstance) => FormattedVideoChannel
  export type ToActivityPubObject = (this: VideoChannelInstance) => VideoChannelObject
  export type IsOwned = (this: VideoChannelInstance) => boolean

  export type CountByAccount = (accountId: number) => Promise<number>
  export type ListOwned = () => Promise<VideoChannelInstance[]>
  export type ListForApi = (start: number, count: number, sort: string) => Promise< ResultList<VideoChannelInstance> >
  export type LoadByIdAndAccount = (id: number, accountId: number) => Promise<VideoChannelInstance>
  export type ListByAccount = (accountId: number) => Promise< ResultList<VideoChannelInstance> >
  export type LoadAndPopulateAccount = (id: number) => Promise<VideoChannelInstance>
  export type LoadByUUIDAndPopulateAccount = (uuid: string) => Promise<VideoChannelInstance>
  export type LoadByUUID = (uuid: string, t?: Sequelize.Transaction) => Promise<VideoChannelInstance>
  export type LoadByHostAndUUID = (uuid: string, podHost: string, t?: Sequelize.Transaction) => Promise<VideoChannelInstance>
  export type LoadAndPopulateAccountAndVideos = (id: number) => Promise<VideoChannelInstance>
}

export interface VideoChannelClass {
  countByAccount: VideoChannelMethods.CountByAccount
  listForApi: VideoChannelMethods.ListForApi
  listByAccount: VideoChannelMethods.ListByAccount
  listOwned: VideoChannelMethods.ListOwned
  loadByIdAndAccount: VideoChannelMethods.LoadByIdAndAccount
  loadByUUID: VideoChannelMethods.LoadByUUID
  loadByHostAndUUID: VideoChannelMethods.LoadByHostAndUUID
  loadAndPopulateAccount: VideoChannelMethods.LoadAndPopulateAccount
  loadByUUIDAndPopulateAccount: VideoChannelMethods.LoadByUUIDAndPopulateAccount
  loadAndPopulateAccountAndVideos: VideoChannelMethods.LoadAndPopulateAccountAndVideos
}

export interface VideoChannelAttributes {
  id?: number
  uuid?: string
  name: string
  description: string
  remote: boolean
  url: string

  Account?: AccountInstance
  Videos?: VideoInstance[]
}

export interface VideoChannelInstance extends VideoChannelClass, VideoChannelAttributes, Sequelize.Instance<VideoChannelAttributes> {
  id: number
  createdAt: Date
  updatedAt: Date

  isOwned: VideoChannelMethods.IsOwned
  toFormattedJSON: VideoChannelMethods.ToFormattedJSON
  toActivityPubObject: VideoChannelMethods.ToActivityPubObject
}

export interface VideoChannelModel extends VideoChannelClass, Sequelize.Model<VideoChannelInstance, VideoChannelAttributes> {}
