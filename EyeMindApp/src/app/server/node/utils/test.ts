import { getState } from '@/app/server/node/dataModels/state'

export async function getServerState() {
  return getState()
}
