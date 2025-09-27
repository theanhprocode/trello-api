
import { Resend } from 'resend'
import { env } from '~/config/environment'


const resendInstance = new Resend(env.RESEND_API_KEY)
const sendEmail = async (recipientEmail, customSubject, htmlContent) => {
  try {
    const data = await resendInstance.emails.send({
      from: env.ADMIN_RESEND_EMAIL,
      to: recipientEmail,
      subject: customSubject,
      html: htmlContent
    })

    return data
  } catch (error) {
    // console.error('Error sending email:', error)
  }
}

export const ResendProvider = {
  sendEmail
}