import { Resend } from 'resend';

const FROM = process.env.EMAIL_FROM || 'Thimlilith <noreply@thimlilith.com>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://thimlilith.com';

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error('RESEND_API_KEY is not configured');
    _resend = new Resend(key);
  }
  return _resend;
}

// Helper to check for errors hidden inside the Resend response
function checkResendError(response: any) {
  if (response.error) {
    throw new Error(`Resend API Error: ${response.error.message}`);
  }
}

function wrapHtml(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0f172a;padding:40px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#1e293b;border-radius:16px;border:1px solid #334155;">
<tr><td style="padding:40px 32px;">
<div style="text-align:center;margin-bottom:32px;">
<div style="font-size:44px;line-height:1;color:#14b8a6;">&#x2D63;</div>
<div style="color:#14b8a6;font-size:24px;font-weight:700;margin-top:8px;">Thimlilith</div>
<div style="color:#94a3b8;font-size:13px;margin-top:4px;">The Gathering</div>
</div>
${bodyHtml}
<hr style="border:none;border-top:1px solid #334155;margin:32px 0 20px;" />
<div style="text-align:center;color:#64748b;font-size:12px;line-height:1.6;">
Thimlilith &mdash; The Gathering<br /><a href="${SITE_URL}" style="color:#14b8a6;text-decoration:none;">${SITE_URL}</a>
</div>
</td></tr>
</table>
<div style="color:#475569;font-size:11px;margin-top:16px;max-width:560px;text-align:center;">If you did not request this email, you can safely ignore it.</div>
</td></tr>
</table>
</body></html>`;
}

function ctaButton(href: string, label: string, color = '#14b8a6'): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:32px auto;"><tr><td align="center" style="background:${color};border-radius:10px;"><a href="${href}" style="display:inline-block;padding:14px 32px;color:#0f172a;font-weight:700;font-size:15px;text-decoration:none;border-radius:10px;">${label}</a></td></tr></table>`;
}

export async function sendPasswordResetEmail(params: { to: string; resetLink: string; displayName?: string; }): Promise<void> {
  const greeting = params.displayName ? `Azul ${params.displayName},` : 'Azul,';
  const body = `
    <h2 style="color:#f1f5f9;font-size:20px;margin:0 0 16px;">Reset your password</h2>
    <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 12px;">${greeting}</p>
    <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 12px;">We received a request to reset the password on your Thimlilith account (<strong style="color:#f1f5f9;">${params.to}</strong>).</p>
    <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 12px;">Click the button below to choose a new password. This link expires in <strong style="color:#f1f5f9;">1 hour</strong> and can only be used once.</p>
    ${ctaButton(params.resetLink, 'Reset my password')}
    <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">If the button does not work, copy and paste this link into your browser:<br /><a href="${params.resetLink}" style="color:#14b8a6;word-break:break-all;">${params.resetLink}</a></p>
  `;
  const response = await getResend().emails.send({ from: FROM, to: params.to, subject: 'Reset your Thimlilith password', html: wrapHtml('Reset your Thimlilith password', body) });
  checkResendError(response); // <-- NEW
}

export async function sendVerificationEmail(params: { to: string; verifyLink: string; displayName?: string; }): Promise<void> {
  const greeting = params.displayName ? `Azul ${params.displayName},` : 'Azul,';
  const body = `
    <h2 style="color:#f1f5f9;font-size:20px;margin:0 0 16px;">Welcome to Thimlilith</h2>
    <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 12px;">${greeting}</p>
    <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 12px;">Thank you for joining the Gathering. To activate your account, please confirm your email address by clicking the button below.</p>
    ${ctaButton(params.verifyLink, 'Verify my email')}
    <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">If the button does not work, copy and paste this link into your browser:<br /><a href="${params.verifyLink}" style="color:#14b8a6;word-break:break-all;">${params.verifyLink}</a></p>
  `;
  const response = await getResend().emails.send({ from: FROM, to: params.to, subject: 'Verify your Thimlilith email', html: wrapHtml('Verify your Thimlilith email', body) });
  checkResendError(response); // <-- NEW
}

export async function sendWelcomeEmail(params: { to: string; displayName?: string; }): Promise<void> {
  const greeting = params.displayName ? `Azul ${params.displayName},` : 'Azul,';
  const body = `
    <h2 style="color:#f1f5f9;font-size:20px;margin:0 0 16px;">Your account is ready</h2>
    <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 12px;">${greeting}</p>
    <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 12px;">Your email is verified. Welcome to the Thajmaath &mdash; the Gathering of the Kabyle community.</p>
    ${ctaButton(`${SITE_URL}/en/rooms`, 'Enter Thimlilith')}
  `;
  const response = await getResend().emails.send({ from: FROM, to: params.to, subject: 'Welcome to Thimlilith', html: wrapHtml('Welcome to Thimlilith', body) });
  checkResendError(response); // <-- NEW
}