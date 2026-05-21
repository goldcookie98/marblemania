import PartySocket from 'partysocket';

// Single shared PartyKit server for all clients (dev + prod).
const DEFAULT_HOST = 'marble-mania.goldcookie98.partykit.dev';

export class MultiplayerClient {
  constructor(opts) {
    const {
      room,
      name,
      marbleName,
      color,
      host = DEFAULT_HOST,
      onWelcome,
      onPlayerJoined,
      onPlayerLeft,
      onPos,
      onMapSet,
      onStart,
      onReset,
      onHostChanged,
      onError
    } = opts;

    this.room = room;
    this.name = name;
    this.marbleName = marbleName;
    this.color = color;
    this.myId = null;
    this.isHost = false;
    this.callbacks = { onWelcome, onPlayerJoined, onPlayerLeft, onPos, onMapSet, onStart, onReset, onHostChanged, onError };

    this.socket = new PartySocket({ host, room });

    this.socket.addEventListener('open', () => {
      this.socket.send(JSON.stringify({
        type: 'join',
        name: this.name,
        marbleName: this.marbleName,
        color: this.color
      }));
    });

    this.socket.addEventListener('error', (e) => {
      if (onError) onError(e);
    });

    this.socket.addEventListener('message', (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch (e) { return; }
      this._dispatch(msg);
    });
  }

  _dispatch(msg) {
    const cb = this.callbacks;
    if (msg.type === 'welcome') {
      this.myId = msg.yourId;
      this.isHost = (msg.hostId === msg.yourId);
      cb.onWelcome?.(msg);
    } else if (msg.type === 'playerJoined') {
      if (msg.id !== this.myId) cb.onPlayerJoined?.(msg);
    } else if (msg.type === 'playerLeft') {
      cb.onPlayerLeft?.(msg.id);
    } else if (msg.type === 'pos') {
      cb.onPos?.(msg);
    } else if (msg.type === 'mapSet') {
      cb.onMapSet?.(msg.mapId);
    } else if (msg.type === 'start') {
      cb.onStart?.(msg.at);
    } else if (msg.type === 'reset') {
      cb.onReset?.();
    } else if (msg.type === 'hostChanged') {
      this.isHost = (msg.id === this.myId);
      cb.onHostChanged?.(msg.id);
    }
  }

  sendPos(x, y, vx, vy) {
    if (this.socket.readyState !== 1) return;
    this.socket.send(JSON.stringify({ type: 'pos', x, y, vx, vy }));
  }

  setMap(mapId) {
    if (!this.isHost) return;
    this.socket.send(JSON.stringify({ type: 'setMap', mapId }));
  }

  startRace() {
    if (!this.isHost) return;
    this.socket.send(JSON.stringify({ type: 'start' }));
  }

  resetRace() {
    if (!this.isHost) return;
    this.socket.send(JSON.stringify({ type: 'reset' }));
  }

  close() {
    this.socket.close();
  }
}
