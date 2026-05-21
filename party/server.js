// PartyKit server: routes per-room messages between marble race clients.
// Each room maintains lightweight state for late-joiners; clients are
// authoritative for their own marble.

export default class MarbleRoom {
  constructor(room) {
    this.room = room;
    this.players = new Map(); // connId -> { name, marbleName, color, x, y, vx, vy }
    this.hostId = null;
    this.mapId = null;
    this.startAt = null;
  }

  onConnect(conn) {
    if (!this.hostId) this.hostId = conn.id;

    conn.send(JSON.stringify({
      type: 'welcome',
      yourId: conn.id,
      hostId: this.hostId,
      mapId: this.mapId,
      startAt: this.startAt,
      players: Array.from(this.players.entries()).map(([id, p]) => ({ id, ...p }))
    }));
  }

  onMessage(message, sender) {
    let msg;
    try { msg = JSON.parse(message); } catch (e) { return; }

    if (msg.type === 'join') {
      const player = {
        name: String(msg.name || 'Player').slice(0, 24),
        marbleName: String(msg.marbleName || 'Red'),
        color: String(msg.color || '#E53935'),
        x: 0, y: 0, vx: 0, vy: 0
      };
      this.players.set(sender.id, player);
      this.room.broadcast(JSON.stringify({
        type: 'playerJoined',
        id: sender.id,
        ...player
      }));
    } else if (msg.type === 'pos') {
      const p = this.players.get(sender.id);
      if (p) {
        p.x = msg.x; p.y = msg.y; p.vx = msg.vx; p.vy = msg.vy;
      }
      this.room.broadcast(
        JSON.stringify({ type: 'pos', id: sender.id, x: msg.x, y: msg.y, vx: msg.vx, vy: msg.vy }),
        [sender.id]
      );
    } else if (msg.type === 'setMap') {
      if (sender.id === this.hostId) {
        this.mapId = msg.mapId;
        this.room.broadcast(JSON.stringify({ type: 'mapSet', mapId: msg.mapId, by: sender.id }));
      }
    } else if (msg.type === 'start') {
      if (sender.id === this.hostId) {
        this.startAt = Date.now() + 1500;
        this.room.broadcast(JSON.stringify({ type: 'start', at: this.startAt }));
      }
    } else if (msg.type === 'reset') {
      if (sender.id === this.hostId) {
        this.startAt = null;
        this.room.broadcast(JSON.stringify({ type: 'reset' }));
      }
    }
  }

  onClose(conn) {
    this.players.delete(conn.id);
    if (this.hostId === conn.id) {
      const next = Array.from(this.players.keys())[0] || null;
      this.hostId = next;
      if (next) {
        this.room.broadcast(JSON.stringify({ type: 'hostChanged', id: next }));
      }
    }
    this.room.broadcast(JSON.stringify({ type: 'playerLeft', id: conn.id }));
  }
}
