import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/email';

export const runtime = 'nodejs';

const Body = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  phone: z.string().max(50).optional().default(''),
  business: z.string().min(1).max(200),
  business_type: z.string().max(100).optional().default(''),
  country: z.string().max(100).optional().default(''),
  website: z.string().max(500).optional().default(''),
  message: z.string().max(2000).optional().default(''),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid submission data.' }, { status: 400 });
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'rana@danhov.com';
  const name = `${body.first_name} ${body.last_name}`;

  await sendEmail({
    to: adminEmail,
    replyTo: body.email,
    subject: `New Trade/Partner Application — ${name} · ${body.business}`,
    html: `
      <div style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;color:#1a1410;">
        <h2 style="font-size:22px;font-weight:400;border-bottom:2px solid #AC3438;padding-bottom:12px;">
          New Trade &amp; Partner Application
        </h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#6b5e57;width:160px;">Name</td><td style="padding:8px 0;font-weight:600;">${name}</td></tr>
          <tr><td style="padding:8px 0;color:#6b5e57;">Email</td><td style="padding:8px 0;"><a href="mailto:${body.email}">${body.email}</a></td></tr>
          <tr><td style="padding:8px 0;color:#6b5e57;">Phone</td><td style="padding:8px 0;">${body.phone || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#6b5e57;">Business</td><td style="padding:8px 0;">${body.business}</td></tr>
          <tr><td style="padding:8px 0;color:#6b5e57;">Type</td><td style="padding:8px 0;">${body.business_type || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#6b5e57;">Country</td><td style="padding:8px 0;">${body.country || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#6b5e57;">Website</td><td style="padding:8px 0;">${body.website ? `<a href="${body.website}">${body.website}</a>` : '—'}</td></tr>
        </table>
        ${body.message ? `<div style="margin-top:20px;padding:16px;background:#faf6f1;border-left:3px solid #b8923a;font-size:14px;line-height:1.6;">${body.message.replace(/\n/g, '<br>')}</div>` : ''}
      </div>
    `,
  });

  await sendEmail({
    to: body.email,
    subject: 'We received your DANHOV trade application',
    html: `
      <div style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;color:#1a1410;">
        <h2 style="font-family:'Georgia',serif;font-size:24px;font-weight:400;">Thank you, ${body.first_name}.</h2>
        <p style="font-size:15px;color:#6b5e57;line-height:1.7;">
          We've received your wholesale application for <strong>${body.business}</strong> and our trade team will
          review it personally. You'll hear from us within one business day.
        </p>
        <p style="font-size:15px;color:#6b5e57;line-height:1.7;">
          In the meantime, feel free to reach us directly at
          <a href="mailto:trade@danhov.com" style="color:#b8923a;">trade@danhov.com</a>.
        </p>
        <p style="font-size:13px;color:#9c8f86;margin-top:32px;">
          — The DANHOV Trade Team<br>
          Handcrafted in Los Angeles since 1984
        </p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
