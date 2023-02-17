import { PubSub, Subscription } from '@google-cloud/pubsub'
import type { MakeReqInfoParams, ReqInfo } from './reqid.js'
import { dec, getReqId } from './reqid.js'

/**
 * Class reperesenting a error that is thrown when a subscription is expiered.
 */
export class SubscriptionIsExpiered extends Error {
  constructor(message: string) {
    //https://stackoverflow.com/questions/41102060/typescript-extending-error-class
    super(message)
    Object.setPrototypeOf(this, SubscriptionIsExpiered.prototype)
  }
  get reason() {
    return this.message
  }
}

// class にまとめる？

export async function createSubWithInfo(
  pubSubClient: PubSub,
  topicNameOrId: string,
  params: MakeReqInfoParams
): Promise<ReqInfo> {
  const info = await getReqId(params)
  await pubSubClient
    .topic(topicNameOrId) // function 側で取得しておいて共有できない?
    .createSubscription(info.sunbscription, {
      labels: { created: `${Date.now()}` },
      filter: `attributes.reqid = "${info.filter}"`
    })
  return info
}

export async function getValidSub(
  pubSubClient: PubSub,
  subscriptionDuration: number,
  handleId: ReqInfo['handleId']
) {
  const subId = await dec(handleId, '', '')
  const sub = pubSubClient.subscription(subId)
  const createdStr = (await sub.get())[1].labels?.created
  if (typeof createdStr === 'string') {
    const created = Number.parseInt(createdStr)
    if (
      typeof created === 'number' &&
      Math.abs(Date.now() - created) < subscriptionDuration // マイナスになるのもおかしいので一定範囲内のみ有効
    ) {
      return sub
    }
  }
  throw new SubscriptionIsExpiered('expiered')
}

export function handleMessage(
  subscription: Subscription,
  messagePullTimeout: number
) {
  return new Promise((resolve) => {
    let timeoutId: NodeJS.Timeout | null = setTimeout(() => {
      subscription.removeListener('message', messageHandler)
      timeoutId = null
      // reject してもよいかも
      resolve(null)
    }, messagePullTimeout)
    const messageHandler = (message: any) => {
      if (timeoutId != null) {
        // "Ack" (acknowledge receipt of) the message
        message.ack()
      }
      resolve(message)
    }
    subscription.once('message', messageHandler)
  })
}
