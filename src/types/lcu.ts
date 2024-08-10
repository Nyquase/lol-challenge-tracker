export interface LCUCredentials {
  address: string
  port: number
  username: string
  password: string
  protocol: string
}

export interface RawChallenge {
  completedIds: string[]
  name: string
  // Lot more but not used
}
