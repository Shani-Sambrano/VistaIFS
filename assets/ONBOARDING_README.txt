VistaIFS Onboarding – Data Capture Options
=========================================

Option A (Free): Google Sheets via Apps Script
----------------------------------------------
1) Create a Google Sheet named "VistaIFS Onboarding".
   On row 1, add headers: timestamp, company, dba, contact, email, phone, address, package, tx_count, frequency, next_pay_date, emp_count, states, notes, pay_method, billing_email, billing_contact, autopay_ok

2) Open Extensions → Apps Script, paste the code below, and save as "Vista Onboarding API".

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActive().getSheetByName('Sheet1') || SpreadsheetApp.getActiveSheet();
    const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
    const row = headers.map(h => data[h] !== undefined ? data[h] : '');
    sheet.appendRow(row);
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok:false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}

3) Deploy → New deployment → Type: Web app.
   - Execute as: Me
   - Who has access: Anyone
   Copy the Web app URL.

4) In /onboarding/index.html set:
   const FORMS_ENDPOINT = "YOUR_WEB_APP_URL";

Option B: Postgres (AWS) – Outline
----------------------------------
- Create an API endpoint (API Gateway) → Lambda (Node/Python) that writes to Amazon RDS (PostgreSQL).
- Secure with an API key or IAM; use parameterized queries to avoid SQL injection.
- In /onboarding/index.html set:
   const FORMS_ENDPOINT = "https://api.yourdomain.com/intake";
   const MODE = "postgres";

Minimal Node/Express Lambda example pseudocode:

app.post('/intake', async (req,res)=> {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.PG_URL });
  const f = req.body;
  await pool.query(
    'INSERT INTO onboarding(timestamp, company, dba, contact, email, phone, address, package, tx_count, frequency, next_pay_date, emp_count, states, notes, pay_method, billing_email, billing_contact, autopay_ok) VALUES (NOW(), $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)',
    [f.company,f.dba,f.contact,f.email,f.phone,f.address,f.package,f.tx_count,f.frequency,f.next_pay_date,f.emp_count,f.states,f.notes,f.pay_method,f.billing_email,f.billing_contact,f.autopay_ok]
  );
  res.json({ ok:true });
});

Security tips
-------------
- Never collect full bank/card numbers on the static site.
- Restrict your API with rate limiting and CORS to vistaifs.com.
- Store secrets in AWS Secrets Manager, not in code.

Secure uploads – AWS presigned S3 (Server)
------------------------------------------
1) Create an S3 bucket: vistaifs-uploads (private).
2) Bucket CORS (Permissions → CORS):
[
  {"AllowedHeaders":["*"],"AllowedMethods":["POST","GET"],"AllowedOrigins":["https://vistaifs.com","https://www.vistaifs.com","http://localhost:5500"],"ExposeHeaders":["ETag"],"MaxAgeSeconds":3000}
]
3) Lambda (Node.js 20) – generate a presigned POST:

const AWS = require('aws-sdk');
const S3 = new AWS.S3({signatureVersion:'v4'});
const BUCKET = process.env.BUCKET;
exports.handler = async (event) => {
  const qs = event.queryStringParameters || {};
  const Key = `onboarding/${Date.now()}-${qs.filename || 'upload'}`;
  const Conditions = [
    ["starts-with", "$key", "onboarding/"],
    ["content-length-range", 0, 10485760] // 10 MB
  ];
  const params = { Bucket: BUCKET, Fields: { key: Key, "Content-Type": qs.type || "application/octet-stream" }, Conditions, Expires: 300 };
  const presign = await S3.createPresignedPost(params);
  const objectUrl = `https://${BUCKET}.s3.amazonaws.com/${Key}`;
  return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ url: presign.url, fields: presign.fields, objectUrl }) };
};

Attach via API Gateway (HTTP API). Set env BUCKET and lock CORS to your domain.

Server-generated LOE (Lambda)
-----------------------------
If you prefer the server to produce a PDF:
- Convert your DOCX into a template (placeholders like {{company}}, {{contact}}, etc.).
- Use a Lambda container image with LibreOffice to convert DOCX→PDF, or render HTML→PDF with headless Chromium.
- Endpoint accepts JSON (same fields as intake), returns a pre-signed URL to the PDF in S3.
- Front-end uses DOCS_ENDPOINT to call it.

YouTube embeds on posts
-----------------------
Edit each blog post's <div class="media" id="ytWrap" data-youtube=""> and paste the video ID (the part after v= in the YouTube URL). If blank, the page will show the fallback MP4.
