/* eslint-disable no-useless-catch */
import ApiError from '~/utils/ApiError.js'
import { userModel } from '~/models/userModel.js'
import { boardModel } from '~/models/boardModel.js'
import { invitationModel } from '~/models/invitationModel.js'
import { INVITATION_TYPE, BOARD_INVITATION_STATUS } from '~/utils/constants'
import { pickUser } from '~/utils/formatters'
import { StatusCodes } from 'http-status-codes'

const createNewBoardInvitation = async (reqBody, inviterId) => {
  // eslint-disable-next-line no-useless-catch
  try {
  // Người đi mời: chính là người đang request, tìm theo id từ token
    const inviter = await userModel.findOneById(inviterId)
    // Người được mời: tìm theo email từ FE
    const invitee = await userModel.findOneByEmail(reqBody.inviteeEmail)
    // Tìm thông tin board mà người dùng muốn mời vào để lấy tên board, đồng thời kiểm tra board có tồn tại hay không
    const board = await boardModel.findOneById(reqBody.boardId)

    // Nếu không tìm thấy inviter, invitee hoặc board thì báo lỗi
    if (!invitee || !inviter || !board) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Inviter, invitee or board not found')
    }

    // Kiểm tra xem user được mời đã là thành viên của board chưa
    const isInviteeMemberOfBoard = board.memberIds.map(memberId => memberId.toString()).includes(invitee._id.toString())
    if (isInviteeMemberOfBoard) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'User is already a member of the board')
    }

    // Kiểm tra không cho mời chính mình
    if (inviter._id.toString() === invitee._id.toString()) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'You can not invite yourself')
    }

    // Tạo data cần thiết để lưu vào DB
    const newInvitationData = {
      inviterId,
      inviteeId: invitee._id.toString(), // Chuyển ObjectId sang string để validate
      type: INVITATION_TYPE.BOARD_INVITATION,
      boardInvitation: {
        boardId: board._id.toString(),
        status: BOARD_INVITATION_STATUS.PENDING // Mặc định là PENDING
      }
    }

    // Lưu invitation vào DB
    const createInvitation = await invitationModel.createNewBoardInvitation(newInvitationData)
    const getInvitation = await invitationModel.findOneById(createInvitation.insertedId)

    // Trả về đủ board, inviter, invitee cho FE
    const resInvitation = {
      ...getInvitation,
      board,
      inviter: pickUser(inviter),
      invitee: pickUser(invitee)
    }
    return resInvitation
  } catch (error) { throw error }
}

const getInvitations = async (userId) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const getInvitations = await invitationModel.findByUser(userId)

    // chuyển dữ liệu sang Json Object để trả về FE
    const resInvitations = getInvitations.map(invitation => ({
      ...invitation,
      inviter: invitation.inviter[0] || {},
      invitee: invitation.invitee[0] || {},
      board: invitation.board[0] || {}
    }))

    return resInvitations
  } catch (error) { throw error }
}

const updateBoardInvitation = async (userId, invitationId, status) => {
  try {
    const getInvitation = await invitationModel.findOneById(invitationId)
    if (!getInvitation) throw new ApiError(StatusCodes.NOT_FOUND, 'Invitation not found')

    // Khi có invitation rồi thì lấy thông tin board
    const boardId = getInvitation.boardInvitation.boardId
    const getBoard = await boardModel.findOneById(boardId)
    if (!getBoard) throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found')

    // Chuyển 2 mảng ownerIds và memberIds sang objectId
    const boardOwnerAndMemberIds = [...getBoard.ownerIds, ...getBoard.memberIds].toString()
    if (status === BOARD_INVITATION_STATUS.ACCEPTED && boardOwnerAndMemberIds.includes(userId)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'You are already a member of the board')
    }

    // Tạo dữ liệu để cập nhật invitation
    const updatedData = {
      boardInvitation: {
        ...getInvitation.boardInvitation,
        status // Cập nhật status FE gửi lên
      }
    }
    // B1: Cập nhật status invitation
    const updatedInvitation = await invitationModel.update(invitationId, updatedData)

    // B2: Thành công thì thêm thông tin user vào memberIds của board
    if (updatedInvitation.boardInvitation.status === BOARD_INVITATION_STATUS.ACCEPTED) {
      await boardModel.pushMemberIds(boardId, userId)
    }
    return updatedInvitation
  } catch (error) { throw error }
}

const deleteInvitation = async (userId, invitationId) => {
  try {
    const invitation = await invitationModel.findOneById(invitationId)
    if (!invitation) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Invitation not found')
    }

    if (invitation.inviteeId.toString() !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'You can not delete this notification')
    }

    const result = await invitationModel.deleteOneById(invitationId)
    return result
  } catch (error) {
    throw error
  }
}

const deleteManyInvitations = async (userId, invitationIds) => {
  try {
    if (!Array.isArray(invitationIds) || invitationIds.length === 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'invitationIds is required')
    }

    // eslint-disable-next-line no-undef
    const validIds = invitationIds.filter(id => ObjectId.isValid(id))
    if (validIds.length === 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'No valid invitation IDs provided')
    }

    // Option 1: kiểm tra từng invitation trước khi xóa
    const invitations = await Promise.all(validIds.map(id => invitationModel.findOneById(id)))
    const invalidOwner = invitations.some(inv => inv && inv.inviteeId.toString() !== userId)
    if (invalidOwner) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'You can not delete notifications that do not belong to you')
    }

    const result = await invitationModel.deleteManyByIds(validIds)
    return result
  } catch (error) {
    throw error
  }
}

export const invitationService = {
  createNewBoardInvitation,
  getInvitations,
  updateBoardInvitation,
  deleteInvitation,
  deleteManyInvitations
}

