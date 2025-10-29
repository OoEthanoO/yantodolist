# Preventing Gmail Spam Filtering - Complete Guide

## Why Emails Go to Spam

Gmail and other email providers use sophisticated algorithms to detect spam. Common reasons your verification emails might be flagged:

1. ❌ **Using Resend's shared domain** (`onboarding@resend.dev`)
2. ❌ **Missing SPF/DKIM/DMARC records**
3. ❌ **No plain text version of email**
4. ❌ **Missing unsubscribe link** (for bulk emails)
5. ❌ **Low sender reputation** (new domain)
6. ❌ **Suspicious content or links**

## ✅ Solutions Implemented

I've updated the email system with the following improvements:

### 1. Plain Text Version Added
- **Why**: Gmail prefers emails with both HTML and plain text versions
- **What**: Added `text` property to all emails
- **Impact**: Significantly improves deliverability

### 2. Email Headers Added
- **X-Entity-Ref-ID**: Unique identifier for each email
- **Tags**: Categorization for better tracking
- **Impact**: Better email identification and deliverability

### 3. Professional Content
- Clear, non-spammy subject lines
- Professional email templates
- Legitimate business purpose (verification)

## 🚀 Critical Steps You Must Take

### Step 1: Verify Your Domain in Resend

Your current setup uses `notifications.ethanyanxu.com`. You need to verify this domain:

1. **Go to Resend Dashboard**
   - Visit [resend.com/domains](https://resend.com/domains)
   - Click "Add Domain"

2. **Add Your Domain**
   ```
   Domain: ethanyanxu.com
   ```

3. **Add DNS Records**
   
   Resend will provide you with DNS records. Add these to your domain provider:

   **SPF Record** (TXT):
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:_spf.resend.com ~all
   ```

   **DKIM Record** (TXT):
   ```
   Type: TXT
   Name: resend._domainkey
   Value: [provided by Resend]
   ```

   **DMARC Record** (TXT):
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:dmarc@ethanyanxu.com
   ```

4. **Wait for Verification**
   - Usually takes 5-30 minutes
   - Status will change to "Verified" in Resend dashboard

### Step 2: Update Production URL

Make sure your `.env` has the correct production URL:

```env
NEXTAUTH_URL="https://yantodolist.ethanyanxu.com"  # or your actual domain
```

### Step 3: Warm Up Your Domain

**New domains have low sender reputation.** Here's how to build it:

1. **Start Slow**: Send to a few verified recipients first
2. **Gradual Increase**: Slowly increase volume over 2-4 weeks
3. **Monitor Metrics**: Check bounce rates and spam reports in Resend
4. **Engagement**: Higher open rates improve reputation

### Step 4: Request Gmail Whitelisting (Optional)

For Gmail users:

1. Ask test users to:
   - Check spam folder
   - Mark email as "Not Spam"
   - Add your email to contacts
   - Reply to the email

2. This signals to Gmail that your emails are legitimate

## 📊 Resend Dashboard Settings

### Enable DKIM Signing
- Go to Resend Dashboard → Domains → Your Domain
- Ensure DKIM is enabled (should be automatic after DNS setup)

### Monitor Email Health
- Check "Analytics" tab for:
  - Delivery rate (should be >98%)
  - Bounce rate (should be <2%)
  - Complaint rate (should be <0.1%)

## 🔍 Testing & Monitoring

### Test Email Deliverability

Use these tools to check your emails:

1. **Mail Tester** (https://www.mail-tester.com/)
   - Send a test email to the address they provide
   - Get a score out of 10
   - Aim for 9/10 or higher

2. **Gmail SMTP Test**
   ```bash
   # Send test email to your Gmail
   # Check if it lands in inbox or spam
   ```

3. **Resend Logs**
   - Check Resend dashboard for delivery status
   - Look for bounces or rejections

### Monitor Ongoing

- **Weekly**: Check Resend analytics
- **Monthly**: Review spam reports
- **After Changes**: Test with Mail Tester

## 🎯 Content Best Practices

### Subject Lines ✅
- ✅ "Verify your YanToDoList account"
- ✅ "Reset your YanToDoList password"
- ❌ "URGENT!!! Click here NOW!!!"
- ❌ "You won a prize!"

### Email Body ✅
- ✅ Clear sender identity
- ✅ Professional formatting
- ✅ Legitimate business purpose
- ✅ Unsubscribe option (for marketing emails)
- ❌ ALL CAPS TEXT
- ❌ Excessive exclamation marks!!!
- ❌ Hidden or deceptive links

### Links ✅
- ✅ Use your domain in URLs
- ✅ HTTPS links
- ✅ Descriptive anchor text
- ❌ Shortened URLs (bit.ly, etc.)
- ❌ IP address links

## 🛠️ Advanced Configuration

### For High-Volume Sending

If you plan to send many emails:

1. **Dedicated IP Address**
   - Contact Resend for dedicated IP
   - Costs extra but gives you full control
   - Must warm up slowly

2. **Subdomain Strategy**
   - Use `mail.ethanyanxu.com` for transactional emails
   - Protects main domain reputation
   - Easier to troubleshoot

3. **Email Authentication**
   ```
   SPF: PASS ✅
   DKIM: PASS ✅
   DMARC: PASS ✅
   ```

### Custom Reply-To Address

Update your email config:

```typescript
await resend.emails.send({
  from: FROM_EMAIL,
  to: email,
  replyTo: 'support@ethanyanxu.com', // Add this
  subject: 'Verify your YanToDoList account',
  // ... rest
})
```

## 📋 Quick Checklist

Before going to production:

- [ ] Domain verified in Resend ✅
- [ ] SPF record added to DNS ✅
- [ ] DKIM record added to DNS ✅
- [ ] DMARC record added to DNS ✅
- [ ] Plain text version in emails ✅
- [ ] Production URL in NEXTAUTH_URL ✅
- [ ] Tested with Mail Tester (score >8/10)
- [ ] Test email sent to Gmail (inbox, not spam)
- [ ] Test email sent to Outlook (inbox, not spam)
- [ ] Monitor Resend analytics for first week
- [ ] Set up email alerts for bounces

## 🆘 Troubleshooting

### Still Going to Spam?

1. **Check DNS Propagation**
   ```bash
   nslookup -type=TXT ethanyanxu.com
   nslookup -type=TXT resend._domainkey.ethanyanxu.com
   ```

2. **Verify Resend Status**
   - Check domain status in dashboard
   - Should show "Verified" with green checkmark

3. **Test Different Providers**
   - Send to Gmail, Outlook, Yahoo
   - Identify which provider is filtering

4. **Review Email Content**
   - Run through Mail Tester
   - Fix any flagged issues

5. **Check Resend Logs**
   - Look for "deferred" or "bounced" status
   - Read error messages

### Common Issues

**Issue**: "SPF record not found"
**Solution**: Wait for DNS propagation (up to 48 hours) or check DNS configuration

**Issue**: "DKIM signature missing"
**Solution**: Verify domain in Resend, ensure DNS records are correct

**Issue**: "Domain not verified"
**Solution**: Complete domain verification in Resend dashboard

**Issue**: "Rate limited"
**Solution**: You're sending too many emails too fast - slow down

## 📈 Expected Results

After implementing all steps:

- **Week 1**: 70-80% inbox placement
- **Week 2-3**: 85-90% inbox placement
- **Week 4+**: 95%+ inbox placement

Building sender reputation takes time. Be patient!

## 🔗 Useful Resources

- [Resend Docs](https://resend.com/docs)
- [Mail Tester](https://www.mail-tester.com/)
- [MXToolbox](https://mxtoolbox.com/)
- [Google Postmaster Tools](https://postmaster.google.com/)
- [Microsoft SNDS](https://postmaster.live.com/snds/)

## 💡 Pro Tips

1. **Consistent Sending**: Regular email volume is better than sporadic bursts
2. **Engagement**: Higher open/click rates improve reputation
3. **Clean List**: Remove bounced/invalid emails immediately
4. **Monitor**: Check Resend analytics weekly
5. **Test**: Always test major changes with Mail Tester
6. **Backup**: Have a backup email provider for critical emails

---

**Note**: Email deliverability is an ongoing process. Keep monitoring and adjusting based on your metrics!
