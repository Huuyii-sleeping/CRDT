export class GCounter {
  private counts: Map<string, number>;
  private clientId: string;
  constructor(clientId: string) {
    this.clientId = clientId;
    this.counts = new Map();
    this.counts.set(clientId, 0);
  }

  increment(by: number = 1): void {
    if (by <= 0) throw new Error("++++++");
    const current = this.counts.get(this.clientId) || 0;
    this.counts.set(this.clientId, current + by);
  }

  value(): number {
    let total = 0;
    for (const count of this.counts.values()) {
      total += count;
    }
    return total;
  }

  getState(): Record<string, number> {
    const state: Record<string, number> = {};
    for (const [client, count] of this.counts) {
      state[client] = count;
    }
    return state;
  }

  merge(remoteState: Record<string, number>): void {
    for (const [client, remoteCount] of Object.entries(remoteState)) {
      const localCount = this.counts.get(client) || 0;
      if (remoteCount > localCount!) {
        this.counts.set(client, remoteCount);
      }
    }
  }

  getDelta(lastSeen: Record<string, number> = {}): Record<string, number> {
    const delta: Record<string, number> = {}
    for (const [client, count] of this.counts) {
        const last = lastSeen[client] || 0
        if(count > last) delta[client] = count
    }
    return delta
  }
}
