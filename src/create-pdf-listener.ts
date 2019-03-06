import { Handler, SNSEvent } from 'aws-lambda';
import axios from 'axios';
import puppeteer from 'puppeteer-core';
import { ICreatePdfOptions } from '../types/create.pdf';

export const ts: Handler = async (evt: SNSEvent) => {
  const snsMessage: ICreatePdfOptions = JSON.parse(evt.Records[0].Sns.Message);

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

  if (headers) {
    await page.setExtraHTTPHeaders(headers);
  }

  if (basicAuth) {
    await page.authenticate({
      password: basicAuth.password,
      username: basicAuth.username,
    });
  }

  await page.goto(url, {
    waitUntil: waitUntil || 'networkidle0',
  });

  if (selector) {
    await page.waitForSelector(selector);
  }

  const buffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    ...pdfOptions,
  });
  await browser.close();

  if (s3Url == null) {
    return {
      body: buffer.toString('base64'),
      headers: { 'Content-type': 'application/pdf' },
      isBase64Encoded: true,
      statusCode: 200,
    };
  }

  const s3Response = await axios.put(s3Url, buffer.toString('base64'), {
    headers: {
      'Content-Type': 'application/pdf',
    },
  });

  return {
    body: JSON.stringify(s3Response.data),
    statusCode: s3Response.status,
  };
};
