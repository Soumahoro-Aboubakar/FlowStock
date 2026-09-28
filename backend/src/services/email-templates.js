import { env } from '../config/env.js';

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function layout({ preheader, title, body }) {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:40px 16px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;">
    <tr><td style="padding:0 4px 20px;">
      <table role="presentation" cellspacing="0" cellpadding="0"><tr>
        <td style="width:36px;height:36px;background:#2563eb;border-radius:10px;text-align:center;vertical-align:middle;color:#ffffff;font-size:17px;font-weight:700;">M</td>
        <td style="padding-left:10px;font-size:15px;font-weight:700;letter-spacing:-.01em;">Materio</td>
      </tr></table>
    </td></tr>
    <tr><td style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px 28px;box-shadow:0 1px 3px rgba(15,23,42,.04);">
      ${body}
    </td></tr>
    <tr><td style="padding:20px 4px 0;font-size:12px;line-height:1.6;color:#94a3b8;">
      Vous recevez cet e-mail car une action a été effectuée sur Materio avec cette adresse.
      Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message.
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}

export function verificationEmail({ name, code }) {
  const firstName = escapeHtml(name.split(' ')[0]);
  const minutes = env.verification.codeTtlMinutes;
  const digits = code.split('').map((digit) => `<td style="width:44px;height:52px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;text-align:center;vertical-align:middle;font-size:24px;font-weight:700;color:#0f172a;font-family:'SF Mono',Menlo,Consolas,monospace;">${digit}</td>`).join('<td style="width:8px;"></td>');
  return {
    subject: `${code} — votre code de vérification Materio`,
    text: `Bonjour ${name.split(' ')[0]},\n\nVotre code de vérification Materio : ${code}\nIl expire dans ${minutes} minutes.\n\nSi vous n'avez pas créé de compte, ignorez cet e-mail.`,
    html: layout({
      preheader: `Votre code : ${code} — valable ${minutes} minutes.`,
      title: 'Confirmez votre adresse e-mail',
      body: `
        <h1 style="margin:0 0 8px;font-size:20px;line-height:1.3;font-weight:700;">Confirmez votre adresse e-mail</h1>
        <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#475569;">Bonjour ${firstName}, saisissez ce code dans Materio pour activer votre compte.</p>
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 24px;"><tr>${digits}</tr></table>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">Ce code expire dans <strong style="color:#0f172a;">${minutes} minutes</strong>. Ne le communiquez à personne : l'équipe Materio ne vous le demandera jamais.</p>`,
    }),
  };
}

export function invitationEmail({ name, invitedBy, role, signupUrl }) {
  const firstName = escapeHtml(name.split(' ')[0]);
  const roleLabel = role === 'admin' ? 'administrateur' : 'collaborateur';
  return {
    subject: `${invitedBy} vous invite sur Materio`,
    text: `Bonjour ${name.split(' ')[0]},\n\n${invitedBy} vous invite à rejoindre Materio en tant que ${roleLabel}.\nCréez votre compte ici : ${signupUrl}`,
    html: layout({
      preheader: `${invitedBy} vous invite à rejoindre Materio.`,
      title: 'Invitation Materio',
      body: `
        <h1 style="margin:0 0 8px;font-size:20px;line-height:1.3;font-weight:700;">Vous êtes invité·e sur Materio</h1>
        <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#475569;">Bonjour ${firstName}, <strong style="color:#0f172a;">${escapeHtml(invitedBy)}</strong> vous invite à rejoindre l'espace de gestion du matériel en tant que ${roleLabel}.</p>
        <a href="${escapeHtml(signupUrl)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:10px;">Créer mon compte</a>
        <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">Le lien ne fonctionne pas ? Copiez cette adresse : ${escapeHtml(signupUrl)}</p>`,
    }),
  };
}
