import nodemailer from 'nodemailer';
import { env, smtpConfigured } from '../config/env.js';

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

export async function sendMail({ to, subject, html, text }) {
  if (!smtpConfigured) {
    // Development fallback: without SMTP credentials the message is printed instead of sent.
    console.info(`\n[mail:dev] To: ${to}\n[mail:dev] Subject: ${subject}\n${text}\n`);
    return;
  }
  await getTransport().sendMail({ from: env.smtp.from, to, subject, html, text });
}

export async function verifyMailer() {
  if (!smtpConfigured) {
    console.warn('SMTP is not configured; emails will be printed to the console.');
    return;
  }
  try {
    await getTransport().verify();
    console.info(`SMTP ready (${env.smtp.host}).`);
  } catch (error) {
    console.error(`SMTP connection failed: ${error.message}`);
  }
}
