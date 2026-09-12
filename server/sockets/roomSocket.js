function ack(fn, payload) {
  if (typeof fn === 'function') fn(payload)
}

/**
 * Wires every Socket.IO event to the in-memory RoomManager. The server only
 * relays state between members of a room — it never stores anything.
 */
export function registerRoomSocket(io, manager) {
  io.on('connection', (socket) => {
    const broadcastTo = (roomId, room) => {
      if (room) io.to(roomId).emit('room:update', { id: roomId, room })
      else io.to(roomId).emit('room:update', { id: roomId, room: null })
    }

    socket.on('room:create', (data, cb) => {
      const res = manager.createRoom(socket.id, data)
      if (res.ok) {
        socket.join(res.id)
        broadcastTo(res.id, res.room)
      }
      ack(cb, res)
    })

    socket.on('room:join', (data, cb) => {
      const res = manager.joinRoom(socket.id, data)
      if (res.ok) {
        socket.join(res.id)
        broadcastTo(res.id, res.room)
      }
      ack(cb, res)
    })

    socket.on('room:rejoin', (data, cb) => {
      const res = manager.rejoinRoom(socket.id, data)
      if (res.ok) {
        socket.join(res.id)
        broadcastTo(res.id, res.room)
      }
      ack(cb, res)
    })

    socket.on('room:leave', (data, cb) => {
      const roomId = String(data?.roomId || '').toUpperCase()
      socket.leave(roomId)
      const res = manager.leaveRoom(socket.id, data)
      if (res.ok && manager.rooms.has(roomId)) {
        broadcastTo(roomId, manager.rooms.get(roomId))
      }
      ack(cb, res)
    })

    socket.on('room:destroy', (data, cb) => {
      const roomId = String(data?.roomId || '').toUpperCase()
      socket.leave(roomId)
      const res = manager.destroyRoom(socket.id, data)
      ack(cb, res)
    })

    socket.on('message:send', (data, cb) => {
      const res = manager.postMessage(socket.id, data)
      if (res.ok) broadcastTo(res.id, res.room)
      ack(cb, res)
    })

    socket.on('message:delete', (data, cb) => {
      const res = manager.deleteMessage(socket.id, data)
      if (res.ok) broadcastTo(res.id, res.room)
      ack(cb, res)
    })

    socket.on('file:add', (data, cb) => {
      const res = manager.addFile(socket.id, data)
      if (res.ok) broadcastTo(res.id, res.room)
      ack(cb, res)
    })

    socket.on('file:delete', (data, cb) => {
      const res = manager.deleteFile(socket.id, data)
      if (res.ok) broadcastTo(res.id, res.room)
      ack(cb, res)
    })

    socket.on('typing', (data) => {
      manager.setTyping(socket.id, data)
    })

    socket.on('message:read', (data, cb) => {
      ack(cb, manager.markRead(socket.id, data))
    })

    socket.on('session:close', () => {
      manager.closeSession(socket.id)
    })

    socket.on('disconnect', () => {
      manager.handleDisconnect(socket.id)
    })
  })
}