import { StatusCodes } from 'http-status-codes'
import { invitationService } from '~/services/invitationService.js'

const createNewBoardInvitation = async (req, res, next) => {
  try {
    const inviterId = req.jwtDecoded._id
    const resInvitation = await invitationService.createNewBoardInvitation(req.body, inviterId)

    res.status(StatusCodes.CREATED).json(resInvitation)
  } catch (error) {
    next(error)
  }
}

const getInvitations = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const resInvitations = await invitationService.getInvitations(userId)

    res.status(StatusCodes.OK).json(resInvitations)
  } catch (error) {
    next(error)
  }
}

const updateBoardInvitation = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { invitationId } = req.params
    const { status } = req.body

    const updateInvitation = await invitationService.updateBoardInvitation(userId, invitationId, status)

    res.status(StatusCodes.OK).json(updateInvitation)
  } catch (error) {
    next(error)
  }
}

const deleteInvitation = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { invitationId } = req.params
    const result = await invitationService.deleteInvitation(userId, invitationId)
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const deleteManyInvitations = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { invitationIds } = req.body
    const result = await invitationService.deleteManyInvitations(userId, invitationIds)
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

export const invitationController = {
  createNewBoardInvitation,
  getInvitations,
  updateBoardInvitation,
  deleteInvitation,
  deleteManyInvitations
}