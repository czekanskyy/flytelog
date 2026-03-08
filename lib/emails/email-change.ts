export function emailChangeHtml(firstName: string, verifyLink: string, locale: string = 'en'): string {
  const isPl = locale === 'pl';

  const texts = {
    title: isPl ? 'Weryfikacja nowego adresu e-mail' : 'Verify your new flyteLog email address',
    heading: isPl ? `Cześć, ${firstName}!` : `Hi, ${firstName}!`,
    body1: isPl
      ? 'Otrzymaliśmy prośbę o zmianę adresu e-mail przypisanego do Twojego konta flyteLog.'
      : 'You recently requested to change the email address associated with your flyteLog account.',
    body2: isPl
      ? 'Kliknij poniższy przycisk, aby zweryfikować ten nowy adres e-mail. Link jest ważny przez 1 godzinę.'
      : 'Click the button below to verify this new email address. This link is valid for 1 hour.',
    btnText: isPl ? 'Zweryfikuj Adres E-mail' : 'Verify Email Address',
    fallbackText: isPl
      ? 'Jeśli przycisk nie działa, możesz skopiować i wkleić ten link w przeglądarce:'
      : "If the button doesn't work, you can copy and paste this link into your browser:",
    footer1: isPl
      ? 'Jeśli nie prosiłeś o tę zmianę, zignoruj tę wiadomość. Twój stary e-mail pozostanie bez zmian.'
      : 'If you did not request this change, please ignore this email and your account will remain associated with your current email address.',
    footer2: isPl ? 'Zbudowane z ☕ i pasją do lotnictwa.' : 'Built with ☕ and a passion for aviation.',
  };

  return /* html */ `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${texts.title}</title>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo / Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#0ea5e920;border:1px solid #0ea5e940;border-radius:16px;padding:14px 20px;">
                    <span style="font-size:22px;font-weight:700;color:#38bdf8;letter-spacing:-0.5px;">flyteLog</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#18181b;border:1px solid #27272a;border-radius:20px;padding:40px 36px;">

              <!-- Icon -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <div style="background-color:#0ea5e915;border:1px solid #0ea5e930;border-radius:50%;width:64px;height:64px;display:inline-block;text-align:center;line-height:64px;font-size:30px;">
                      📧
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#f4f4f5;text-align:center;letter-spacing:-0.5px;">
                ${texts.heading}
              </h1>
              <p style="margin:0 0 8px;font-size:15px;color:#71717a;text-align:center;line-height:1.6;">
                ${texts.body1}
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#71717a;text-align:center;line-height:1.6;">
                ${texts.body2}
              </p>

              <!-- Divider -->
              <div style="border-top:1px solid #27272a;margin:28px 0;"></div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${verifyLink}"
                       style="display:inline-block;background-color:#0ea5e9;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 32px;border-radius:10px;letter-spacing:0.1px;">
                      ${texts.btnText}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:30px 0 8px;font-size:14px;color:#71717a;text-align:center;">
                ${texts.fallbackText}
              </p>
              <p style="margin:0;font-size:13px;color:#0ea5e9;text-align:center;word-break:break-all;">
                <a href="${verifyLink}" style="color:#0ea5e9;">${verifyLink}</a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#3f3f46;line-height:1.6;">
                ${texts.footer1}
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#3f3f46;">
                ${texts.footer2}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export const emailChangeSubject = (locale: string = 'en') =>
  locale === 'pl' ? 'Weryfikacja nowego adresu e-mail - flyteLog' : 'Verify your new flyteLog email address';
