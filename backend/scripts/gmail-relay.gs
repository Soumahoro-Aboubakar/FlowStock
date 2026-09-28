// Flowstock mail relay: sends the API's emails from your Gmail account over HTTPS,
// because Render's free instances block outbound SMTP ports (25, 465, 587).
//
// Setup (once):
//  1. https://script.google.com → New project → paste this file.
//  2. Project Settings → Script Properties → add RELAY_SECRET = a long random string.
//  3. Deploy → New deployment → type "Web app", Execute as "Me", Who has access "Anyone".
//     Authorize the Gmail permission, then copy the web app URL (ends with /exec).
//  4. On Render (backend): MAIL_RELAY_URL = that URL, MAIL_RELAY_SECRET = the same secret.
// After editing this file, use Deploy → Manage deployments → Edit → New version (the URL stays the same).

function doPost(e) {
  var reply = function (body) {
    return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
  };
  try {
    var secret = PropertiesService.getScriptProperties().getProperty('RELAY_SECRET');
    var data = JSON.parse(e.postData.contents);
    if (!secret || data.secret !== secret) return reply({ ok: false, error: 'unauthorized' });

    GmailApp.sendEmail(data.to, data.subject, data.text || '', {
      htmlBody: data.html,
      name: data.fromName || undefined,
    });
    return reply({ ok: true });
  } catch (error) {
    return reply({ ok: false, error: String(error) });
  }
}
