# Email Verification Setup Guide

## Overview

YanToDoList now includes email verification for new account signups. Users must verify their email address before they can sign in.

## Features

✅ **Email Verification Required** - New users must verify their email before accessing their account  
✅ **Beautiful Email Templates** - Modern, responsive HTML emails with gradient headers  
✅ **Resend Integration** - Using Resend for reliable email delivery  
✅ **Token Expiration** - Verification links expire after 24 hours  
✅ **Resend Functionality** - Users can request a new verification email  
✅ **Modern UI** - Clean verification page with success/error states  

## Setup Instructions

### 1. Get a Resend API Key

1. Go to [resend.com](https://resend.com) and create a free account
2. Navigate to the API Keys section
3. Create a new API key
4. Copy the API key

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# Resend API for Email Verification
RESEND_API_KEY="re_your_actual_api_key_here"
EMAIL_FROM="YanToDoList <noreply@yourdomain.com>"
```

**Important Notes:**
- For development, Resend allows sending to verified email addresses only
- For production, you'll need to verify your domain in Resend
- The free tier includes 100 emails/day (3,000/month)

### 3. Verify Your Domain (Production Only)

For production use:

1. Go to Resend Dashboard → Domains
2. Add your domain (e.g., `yourdomain.com`)
3. Add the DNS records provided by Resend
4. Wait for verification (usually a few minutes)
5. Update `EMAIL_FROM` to use your domain:
   ```env
   EMAIL_FROM="YanToDoList <noreply@yourdomain.com>"
   ```

### 4. Test the Flow

1. Start your development server: `npm run dev`
2. Click "Sign Up" and create an account
3. Check your email for the verification link
4. Click the link to verify your account
5. Sign in with your verified account

## User Flow

### Signup Process

1. User enters name, email, and password
2. Account is created with `emailVerified = null`
3. Verification token is generated (expires in 24 hours)
4. Beautiful verification email is sent
5. User sees success message with instructions
6. User clicks "Resend email" if needed

### Verification Process

1. User clicks link in email
2. Token is validated and checked for expiration
3. User's `emailVerified` field is updated
4. Success page is displayed
5. User is redirected to sign in

### Sign In Process

1. User enters email and password
2. Credentials are checked
3. Email verification status is checked
4. If not verified, error message with resend option is shown
5. If verified, user is signed in successfully

## Email Templates

The system includes two professional email templates:

### Verification Email
- Modern gradient header
- Clear call-to-action button
- Fallback link for copying
- Expiration warning
- Responsive design

### Password Reset Email (For Future Use)
- Similar styling to verification email
- Security-focused messaging
- 1-hour expiration

## API Routes

### `POST /api/auth/signup`
Creates new user and sends verification email

### `GET /api/auth/verify-email?token={token}`
Verifies email address using token

### `POST /api/auth/resend-verification`
Resends verification email

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

## Database Schema

The system uses the existing Prisma schema:

```prisma
model User {
  emailVerified DateTime? // Set when email is verified
  // ... other fields
}

model VerificationToken {
  identifier String   // User's email
  token      String   @unique
  expires    DateTime
  
  @@unique([identifier, token])
}
```

## Security Features

✅ **Token Expiration** - Tokens expire after 24 hours  
✅ **One-Time Use** - Tokens are deleted after successful verification  
✅ **No User Enumeration** - Resend endpoint doesn't reveal if user exists  
✅ **Secure Tokens** - 32-byte random hex strings  
✅ **HTTPS Required** - Production should use HTTPS  

## Development vs Production

### Development
- Use Resend's test mode (onboarding@resend.dev)
- Can only send to verified email addresses
- No domain verification needed

### Production
- Verify your domain
- Update `EMAIL_FROM` with your domain
- Set `NEXTAUTH_URL` to your production URL
- Ensure HTTPS is enabled

## Troubleshooting

### Emails Not Sending

1. **Check API Key**: Ensure `RESEND_API_KEY` is set correctly
2. **Verify Email**: In development, the recipient must be verified in Resend
3. **Check Logs**: Look for errors in server console
4. **Rate Limits**: Free tier has 100 emails/day limit

### Token Expired

- Tokens expire after 24 hours
- User can request a new verification email
- Old tokens are automatically deleted

### Already Verified

- System detects if email is already verified
- Shows appropriate message
- Deletes unnecessary tokens

## Cost

**Resend Pricing (Free Tier):**
- 3,000 emails/month
- 100 emails/day
- Perfect for small to medium applications

## Future Enhancements

Potential improvements:

- [ ] Password reset functionality (templates already included!)
- [ ] Email change verification
- [ ] Welcome email after verification
- [ ] Email preferences/notifications
- [ ] Two-factor authentication

## Support

For issues or questions:
- Check Resend dashboard for delivery status
- Review server logs for errors
- Ensure environment variables are set correctly
- Verify DNS records (production only)

---

**Note**: Remember to keep your `RESEND_API_KEY` secret and never commit it to version control!
