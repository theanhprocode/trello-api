const onlineUsers = new Map()

export const onlineUserSocket = (io, socket) => {
  // Khi user online, lưu vào Map và broadcast danh sách
  socket.on('FE_USER_ONLINE', (userId) => {
    onlineUsers.set(userId, socket.id)
    io.emit('BE_USER_ONLINE_LIST', Array.from(onlineUsers.keys()))
  })

  // Khi user disconnect, xóa khỏi Map và broadcast lại
  socket.on('disconnect', () => {
    for (const [userId, socketId] of onlineUsers) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId)
        break
      }
    }
    io.emit('BE_USER_ONLINE_LIST', Array.from(onlineUsers.keys()))
  })
}
