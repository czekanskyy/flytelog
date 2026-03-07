/**
 * Welcome email template — sent after successful registration.
 */
export function welcomeEmailHtml(firstName: string): string {
  return /* html */`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to flyteLog</title>
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
                    <span style="font-size:22px;font-weight:700;color:#38bdf8;letter-spacing:-0.5px;">✈️ flyteLog</span>
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
                      🛫
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#f4f4f5;text-align:center;letter-spacing:-0.5px;">
                Welcome aboard, ${firstName}!
              </h1>
              <p style="margin:0 0 28px;font-size:15px;color:#71717a;text-align:center;line-height:1.6;">
                Your flyteLog account is ready. Clear skies ahead.
              </p>

              <!-- Divider -->
              <div style="border-top:1px solid #27272a;margin-bottom:28px;"></div>

              <!-- Features -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:16px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:20px;width:36px;vertical-align:top;padding-top:2px;">📒</td>
                        <td>
                          <p style="margin:0;font-size:14px;font-weight:600;color:#e4e4e7;">EASA-Compliant Logbook</p>
                          <p style="margin:2px 0 0;font-size:13px;color:#71717a;">Log flights for aeroplanes, gliders, and simulators.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:16px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:20px;width:36px;vertical-align:top;padding-top:2px;">🗺️</td>
                        <td>
                          <p style="margin:0;font-size:14px;font-weight:600;color:#e4e4e7;">VFR Flight Planning</p>
                          <p style="margin:2px 0 0;font-size:13px;color:#71717a;">Search waypoints and plan routes on an interactive map.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:20px;width:36px;vertical-align:top;padding-top:2px;">📄</td>
                        <td>
                          <p style="margin:0;font-size:14px;font-weight:600;color:#e4e4e7;">Operational Flight Plans</p>
                          <p style="margin:2px 0 0;font-size:13px;color:#71717a;">Auto-generate OFPs with fuel, W&amp;B and performance data.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <div style="border-top:1px solid #27272a;margin:28px 0;"></div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://flytelog.app'}/login"
                       style="display:inline-block;background-color:#0ea5e9;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 32px;border-radius:10px;letter-spacing:0.1px;">
                      Open flyteLog →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#3f3f46;line-height:1.6;">
                This email was sent to you because you just created an account on flyteLog.<br />
                If you didn't sign up, you can safely ignore this email.
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#3f3f46;">
                Built with ☕ and a passion for aviation.
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

export const welcomeEmailSubject = (firstName: string) =>
  `Welcome to flyteLog, ${firstName}! ✈️`;
