'use strict';
const puppeteer = require('puppeteer');
const axios = require('axios');
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

  if (!body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Request must contain non-empty body.' }),
    };
  }

  const {
    url,
    headers,
    pdfOptions,
    basicAuth,
    waitUntil,
    selector,
    s3Url,
  } = body;
  console.log(body);
  if (!isUrl(url)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Request body must contain valid url.' }),
    };
  } else if (s3Url && !isUrl(s3Url)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Request body must contain valid s3 url.',
      }),
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

  selector && (await page.waitForSelector(selector));

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

  if (!s3Url) {
    return {
      body: buffer.toString('base64'),
      isBase64Encoded: true,
      headers: { 'Content-type': 'application/pdf' },
      statusCode: 200,
    };
  }

  const s3Response = await axios.put(url, buffer.toString('base64'), {
    headers: {
      'Content-Type': 'application/pdf',
    },
  });

  return {
    statusCode: s3Response.status,
    body: JSON.stringify(s3Response.data),
  };
};
