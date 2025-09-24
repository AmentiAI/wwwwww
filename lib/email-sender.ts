import nodemailer from 'nodemailer'

export interface EmailConfig {
  user: string
  pass: string
}

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  config: EmailConfig
): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: config.user,
        pass: config.pass,
      },
    })

    const mailOptions = {
      from: config.user,
      to,
      subject,
      text,
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Email sending failed:', error)
    return false
  }
}

export function generateOutreachEmail(domain: string, email: string): { subject: string; text: string } {
  const subject = `Partnership Opportunity with ${domain}`
  
  const text = `Hello,

I hope this email finds you well. I came across ${domain} and was impressed by your online presence.

I'm reaching out to explore potential partnership opportunities that could be mutually beneficial for both our organizations.

Would you be interested in a brief conversation to discuss how we might work together?

Best regards,
[Your Name]

---
This email was sent via our automated outreach system. If you'd prefer not to receive future emails, please let us know.`

  return { subject, text }
}
