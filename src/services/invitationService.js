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
    // Tìm board để lấy data xử lý
    const board = await boardModel.findOneById(reqBody.boardId)

    // Nếu không tìm thấy inviter, invitee hoặc board thì báo lỗi
    if (!invitee || !inviter || !board) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Inviter, invitee or board not found')
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
    console.log('getInvitations: ', getInvitations)

    return getInvitations
  } catch (error) { throw error }
}

export const invitationService = {
  createNewBoardInvitation,
  getInvitations
}

