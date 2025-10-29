import 'server-only'
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.EMAIL_FROM || 'YanToDoList <onboarding@resend.dev>'

// Use production domain or localhost for development
const getAppUrl = () => {
  // In production, use the custom domain
  if (process.env.NODE_ENV === 'production') {
    return 'https://todo.ethanyanxu.com'
  }
  // In development, use localhost
  return 'http://localhost:3000'
}

const APP_URL = getAppUrl()

export async function sendVerificationEmail(
  email: string,
  token: string,
  name?: string
) {
  const verificationUrl = `${APP_URL}/verify-email?token=${token}`

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Verify your YanToDoList account',
      // Add plain text version for better deliverability
      text: `
Welcome${name ? `, ${name}` : ''}!

Thank you for creating an account with YanToDoList! We're excited to have you on board.

To get started, please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account with YanToDoList, you can safely ignore this email.

---
YanToDoList - Organize your tasks efficiently
© ${new Date().getFullYear()} YanToDoList. All rights reserved.
      `.trim(),
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                          📝 YanToDoList
                        </h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                          Welcome${name ? `, ${name}` : ''}! 👋
                        </h2>
                        <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                          Thank you for creating an account with YanToDoList! We're excited to have you on board.
                        </p>
                        <p style="margin: 0 0 30px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                          To get started, please verify your email address by clicking the button below:
                        </p>
                        
                        <!-- Button -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding: 0 0 30px;">
                              <a href="${verificationUrl}" style="display: inline-block; padding: 16px 40px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                                Verify Email Address
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                          Or copy and paste this link into your browser:
                        </p>
                        <p style="margin: 0 0 30px; padding: 12px; background-color: #f3f4f6; border-radius: 6px; color: #3b82f6; font-size: 13px; word-break: break-all;">
                          ${verificationUrl}
                        </p>
                        
                        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                          <p style="margin: 0 0 10px; color: #6b7280; font-size: 13px; line-height: 1.6;">
                            <strong>⏰ This link will expire in 24 hours.</strong>
                          </p>
                          <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                            If you didn't create an account with YanToDoList, you can safely ignore this email.
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                          YanToDoList - Organize your tasks efficiently
                        </p>
                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                          © ${new Date().getFullYear()} YanToDoList. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      // Add email headers to improve deliverability
      headers: {
        'X-Entity-Ref-ID': crypto.randomUUID(),
      },
      tags: [
        {
          name: 'category',
          value: 'email_verification',
        },
      ],
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send verification email:', error)
    return { success: false, error }
  }
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  name?: string
) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Reset your YanToDoList password',
      // Add plain text version
      text: `
Password Reset Request

${name ? `Hi ${name},` : 'Hello,'} we received a request to reset your password.

Click the link below to create a new password:

${resetUrl}

This link will expire in 1 hour. If you didn't request this, please ignore this email.

---
YanToDoList - Organize your tasks efficiently
© ${new Date().getFullYear()} YanToDoList. All rights reserved.
      `.trim(),
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <tr>
                      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                          📝 YanToDoList
                        </h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                          Password Reset Request
                        </h2>
                        <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                          ${name ? `Hi ${name},` : 'Hello,'} we received a request to reset your password.
                        </p>
                        <p style="margin: 0 0 30px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                          Click the button below to create a new password:
                        </p>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding: 0 0 30px;">
                              <a href="${resetUrl}" style="display: inline-block; padding: 16px 40px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                                Reset Password
                              </a>
                            </td>
                          </tr>
                        </table>
                        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                          <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                            <strong>This link will expire in 1 hour.</strong> If you didn't request this, please ignore this email.
                          </p>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      // Add email headers to improve deliverability
      headers: {
        'X-Entity-Ref-ID': crypto.randomUUID(),
      },
      tags: [
        {
          name: 'category',
          value: 'password_reset',
        },
      ],
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    return { success: false, error }
  }
}
