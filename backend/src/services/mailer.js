import nodemailer from 'nodemailer';
import { env, mailConfigured, relayConfigured } from '../config/env.js';

let transport = null;

function getTransport() {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transport;
}

// Display name of MAIL_FROM ("Flowstock <team@example.com>"); the relay always sends from its Gmail account.
function senderName(value) {
  const match = /^\s*"?([^"<]*?)"?\s*<[^>]+>\s*$/.exec(value || '');
  return match && match[1] ? match[1] : undefined;
}

async function sendWithRelay({ to, subject, html, text }) {
  const response = await fetch(env.mailRelay.url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ secret: env.mailRelay.secret, to, subject, html, text, fromName: senderName(env.smtp.from) }),
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
  });
  const result = await response.json().catch(() => null);
  // Apps Script always answers 200; failures are reported in the body.
  if (!response.ok || !result || !result.ok) {
    throw new Error(`Mail relay failed (${response.status}): ${result?.error || 'invalid response'}`);
  }
}

export async function sendMail({ to, subject, html, text }) {
  if (!mailConfigured) {
    // Development fallback: without mail credentials the message is printed instead of sent.
    console.info(`\n[mail:dev] To: ${to}\n[mail:dev] Subject: ${subject}\n${text}\n`);
    return;
  }
  if (relayConfigured) return sendWithRelay({ to, subject, html, text });
  await getTransport().sendMail({ from: env.smtp.from, to, subject, html, text });
}

export async function verifyMailer() {
  if (!mailConfigured) {
    console.warn('Email is not configured; emails will be printed to the console.');
    return;
  }
  if (relayConfigured) {
    console.info('Email via Gmail relay (Apps Script over HTTPS).');
    return;
  }
  try {
    await getTransport().verify();
    console.info(`SMTP ready (${env.smtp.host}).`);
  } catch (error) {
    console.error(`SMTP connection failed: ${error.message}`);
  }
}
