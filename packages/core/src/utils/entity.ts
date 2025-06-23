import type { Entity } from 'telegram/define'

import type { CoreEntity } from '../services/entity'
import type { Result } from './monad'

import { Api } from 'telegram'

import { Err, Ok } from './monad'

export function resolveEntity(entity: Entity): Result<CoreEntity> {
  if (entity instanceof Api.User) {
    return Ok({
      type: 'user',
      id: entity.id.toString(),
      name: `${entity.firstName ?? ''} ${entity.lastName ?? ''}`,
      username: entity.username ?? entity.id.toString(),
    })
  }

  if (entity instanceof Api.Chat) {
    return Ok({
      type: 'chat',
      id: entity.id.toString(),
      name: entity.title,
    })
  }

  if (entity instanceof Api.Channel) {
    return Ok({
      type: 'channel',
      id: entity.id.toString(),
      name: entity.title,
    })
  }

  return Err(new Error('Unknown entity type'))
}
