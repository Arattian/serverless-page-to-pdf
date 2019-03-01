'use strict';
const puppeteer = require('puppeteer');
const axios = require('axios');

module.exports.js = async evt => {
  const snsMessage = JSON.parse(evt.Records[0].Sns.Message);

  const {
    url,
    headers,
    pdfOptions,
    basicAuth,
    waitUntil,
    selector,
    s3Url,
  } = snsMessage;

  let browser;
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-gpu', '--single-process'],
      executablePath: '/opt/headless_shell',
      headless: true,
    });
  } catch (e) {
    throw new Error(e);
  }

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

  const s3Response = await axios.put(s3Url, buffer.toString('base64'), {
    headers: {
      'Content-Type': 'application/pdf',
    },
  });

  return {
    statusCode: s3Response.status,
    body: JSON.stringify(s3Response.data),
  };
};
