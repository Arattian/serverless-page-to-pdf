'use strict';
const puppeteer = require('puppeteer');
const isUrl = require('./is-url');

module.exports.js = async evt => {
  let body;
  try {
    body = evt.isBase64Encoded
      ? JSON.parse(Buffer.from(evt.body, 'base64').toString())
      : JSON.parse(evt.body);
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: error.message,
        body: evt.body,
      }),
    };
  }

  const { url, headers, pdfOptions, basicAuth, waitUntil } = body;

  if (!isUrl(url)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Request body must contain valid url.' }),
    };
  }

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-gpu', '--single-process'],
    executablePath: '/opt/headless_shell',
    headless: true,
  });

  const page = await browser.newPage();
  headers && (await page.setExtraHTTPHeaders(headers));
  basicAuth &&
    (await page.authenticate({
      username: basicAuth.username,
      password: basicAuth.password,
    }));
  await page.goto(url, {
    waitUntil: waitUntil || 'networkidle0',
  });
  const buffer = await page.pdf(
    Object.assign(
      {},
      {
        format: 'A4',
        printBackground: true,
      },
      pdfOptions,
    ),
  );
  await browser.close();
  return {
    body: buffer.toString('base64'),
    isBase64Encoded: true,
    headers: { 'Content-type': 'application/pdf' },
    statusCode: 200,
  };
};
