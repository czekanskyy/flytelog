import { Resend } from 'resend';
import { welcomeEmailHtml, welcomeEmailSubject } from './welcome';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'flyteLog <noreply@flytelog.app>';

/**
 * Wysyła welcome email po rejestracji.
 * Nie rzuca błędu — loguje i odpuszcza, żeby nie blokować rejestracji.
 */
export async function sendWelcomeEmail(to: string, firstName: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: welcomeEmailSubject(firstName),
    html: welcomeEmailHtml(firstName),
  });

  if (error) {
    console.error('[email] Failed to send welcome email:', error);
  }
}
