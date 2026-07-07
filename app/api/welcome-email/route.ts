import { NextRequest, NextResponse } from 'next/server';

// Sends the post-onboarding welcome email via Resend's REST API.
// Fire-and-forget from the client: missing key or a send failure returns
// ok:false but never blocks onboarding.

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json() as { email: string; name: string };
    if (!email?.trim()) return NextResponse.json({ ok: false, error: 'Missing email' }, { status: 400 });

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('RESEND_API_KEY not set — skipping welcome email');
      return NextResponse.json({ ok: false, skipped: true });
    }

    const firstName = (name || '').trim().split(/\s+/)[0] || 'there';

    const html = `
<div style="background-color:#f4f4f4;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
    <tr>
      <td style="background-color:#1A1613;padding:32px 40px;text-align:center;">
        <img src="https://theramphq.app/icon-512.png" width="56" height="56" alt="The Ramp" style="border-radius:12px;display:block;margin:0 auto;">
        <div style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:0.02em;margin-top:14px;">THE RAMP</div>
      </td>
    </tr>
    <tr>
      <td style="padding:40px;">
        <h1 style="font-size:22px;font-weight:800;color:#1A1613;margin:0 0 12px;">Welcome aboard, ${firstName} 👋</h1>
        <p style="font-size:15px;line-height:1.6;color:#6b655e;margin:0 0 20px;">
          You're set up and ready to go. The fastest way to feel the difference is to run one rep today:
        </p>
        <table role="presentation" width="100%" style="margin:0 0 24px;">
          <tr><td style="padding:8px 0;font-size:14px;color:#1A1613;line-height:1.5;">📞&nbsp;&nbsp;<strong>Run a mock call</strong> — the AI plays a real prospect, then scores you</td></tr>
          <tr><td style="padding:8px 0;font-size:14px;color:#1A1613;line-height:1.5;">🛡️&nbsp;&nbsp;<strong>Drill an objection</strong> — instant feedback on your response</td></tr>
          <tr><td style="padding:8px 0;font-size:14px;color:#1A1613;line-height:1.5;">🔥&nbsp;&nbsp;<strong>Start your streak</strong> — one rep a day compounds fast</td></tr>
        </table>
        <div style="text-align:center;margin:0 0 24px;">
          <a href="https://theramphq.app" style="display:inline-block;background-color:#F5552E;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:999px;text-decoration:none;">
            Open The Ramp
          </a>
        </div>
        <p style="font-size:13px;line-height:1.6;color:#9c958b;margin:0;">
          Questions or feedback? Just reply to this email.
        </p>
      </td>
    </tr>
  </table>
</div>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'The Ramp <hello@theramphq.app>',
        to: [email.trim()],
        subject: 'Welcome to The Ramp — run your first rep today',
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      return NextResponse.json({ ok: false });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Welcome email error:', err);
    return NextResponse.json({ ok: false });
  }
}
