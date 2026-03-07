import { Resend } from 'resend';
import { welcomeEmailHtml, welcomeEmailSubject } from './welcome';
import { registrationEmailHtml, registrationEmailSubject } from './registration';
import { passwordResetEmailHtml, passwordResetEmailSubject } from './password-reset';
import { emailChangeHtml, emailChangeSubject } from './email-change';

const resend = new Resend(process.env.RESEND_API_KEY);
// Domena czekanski.dev jest zweryfikowana w Resend
const FROM = process.env.EMAIL_FROM || 'flyteLog <noreply@czekanski.dev>';

export async function sendWelcomeEmail(to: string, firstName: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: welcomeEmailSubject(firstName),
    html: welcomeEmailHtml(firstName),
  });
  if (error) console.error('[email] welcome:', error);
}

export async function sendRegistrationEmail(to: string, magicLink: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: registrationEmailSubject(),
    html: registrationEmailHtml(magicLink),
  });
  if (error) console.error('[email] registration:', error);
}

export async function sendPasswordResetEmail(to: string, resetLink: string, firstName: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: passwordResetEmailSubject(),
    html: passwordResetEmailHtml(firstName, resetLink),
  });
  if (error) console.error('[email] password-reset:', error);
}

export async function sendEmailChangeConfirmation(email: string, magicLink: string, userName: string, locale?: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: emailChangeSubject(locale),
    html: emailChangeHtml(userName, magicLink, locale),
  });
  if (error) console.error('[email] email-change:', error);
}
