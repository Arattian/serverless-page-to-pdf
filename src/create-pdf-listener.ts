import { Handler, SNSEvent } from 'aws-lambda';
import fs from 'fs';
import puppeteer from 'puppeteer-core';
import request from 'request';
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

  if (s3Url == null) {
    throw new Error('S3 URL is missing');
  }

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-gpu', '--single-process'],
    executablePath: '/opt/headless_shell',
    headless: true,
  });

  const page = await browser.newPage();

  if (headers != null) {
    await page.setExtraHTTPHeaders(headers);
  }

  if (basicAuth != null) {
    await page.authenticate({
      password: basicAuth.password,
      username: basicAuth.username,
    });
  }

  await page.goto(url, { waitUntil: waitUntil || 'networkidle0' });

  if (selector != null) {
    await page.waitForSelector(selector);
  }

  const buffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    ...pdfOptions,
  });

  await browser.close();

  const filePath = `/tmp/${Date.now()}.pdf`;

  fs.writeFileSync(filePath, buffer);

  const stats = fs.statSync(filePath);

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath).pipe(
      request(
        {
          headers: {
            'Content-Length': stats.size,
            'Content-Type': 'application/pdf',
          },
          method: 'PUT',
          url: s3Url,
        },
        (err: Error, res) => {
          if (err) {
            return reject(err);
          }
          fs.unlinkSync(filePath);
          return resolve(res);
        },
      ),
    );
  });
};
