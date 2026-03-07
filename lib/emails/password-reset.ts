export function passwordResetEmailHtml(firstName: string, resetLink: string): string {
  return /* html */`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your flyteLog password</title>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="background-color:#0ea5e920;border:1px solid #0ea5e940;border-radius:16px;padding:14px 20px;">
                  <span style="font-size:22px;font-weight:700;color:#38bdf8;letter-spacing:-0.5px;">flyteLog</span>
                </td>
              </tr></table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#18181b;border:1px solid #27272a;border-radius:20px;padding:40px 36px;">

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <div style="background-color:#f9731615;border:1px solid #f9731630;border-radius:50%;width:64px;height:64px;display:inline-block;text-align:center;line-height:64px;font-size:30px;">🔑</div>
                  </td>
                </tr>
              </table>

              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#f4f4f5;text-align:center;letter-spacing:-0.5px;">
                Password reset request
              </h1>
              <p style="margin:0 0 28px;font-size:15px;color:#71717a;text-align:center;line-height:1.6;">
                Hi ${firstName}, we received a request to reset your flyteLog password.<br />
                This link expires in <strong style="color:#f97316;">15 minutes</strong>.
              </p>

              <div style="border-top:1px solid #27272a;margin-bottom:28px;"></div>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${resetLink}"
                       style="display:inline-block;background-color:#f97316;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 32px;border-radius:10px;letter-spacing:0.1px;">
                      Reset password →
                    </a>
                  </td>
                </tr>
              </table>

              <div style="border-top:1px solid #27272a;margin:28px 0 0;"></div>

              <p style="margin:20px 0 0;font-size:12px;color:#52525b;text-align:center;line-height:1.7;">
                If the button doesn't work, copy and paste this link:<br />
                <span style="color:#f97316;word-break:break-all;">${resetLink}</span>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#3f3f46;line-height:1.6;">
                If you didn't request a password reset, you can safely ignore this email.<br />
                Your password won't change until you click the link above.
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

export const passwordResetEmailSubject = () => 'Reset your flyteLog password 🔑';
