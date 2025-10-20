
import { Resend } from 'resend'
import { env } from '~/config/environment'

const sendEmail = async (recipientEmail, customSubject, htmlContent) => {
  try {
    // Check if API key exists
    if (!env.RESEND_API_KEY) {
      // eslint-disable-next-line no-console
      console.warn('⚠️ RESEND_API_KEY not configured - skipping email sending')
      return { message: 'Email sending skipped - API key not configured' }
    }

    // Create Resend instance inside function
    const resendInstance = new Resend(env.RESEND_API_KEY)
    
    const data = await resendInstance.emails.send({
      from: env.ADMIN_RESEND_EMAIL || 'onboarding@resend.dev',
      to: recipientEmail,
      subject: customSubject,
      html: htmlContent
    })

    // eslint-disable-next-line no-console
    console.log('✅ Email sent successfully to:', recipientEmail)
    return data
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Error sending email:', error.message)
    throw new Error(`Failed to send email: ${error.message}`)
  }
}

export const ResendProvider = {
  sendEmail
}