'use strict';
const isUrl = require('./is-url');
const { SNS } = require('aws-sdk');
const { AWS_CURRENT_REGION, AWS_CURRENT_STAGE, SNS_PORT } = process.env;

module.exports.js = async (evt, ctx) => {
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

  const { url, s3Url } = body;
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

  let sns = new SNS({ maxRetries: 1 });

  if (AWS_CURRENT_STAGE === 'local') {
    sns = new SNS({
      region: AWS_CURRENT_REGION,
      endpoint: `http://127.0.0.1:${SNS_PORT}`,
    });
  }

  let awsAccountId = '123456789012';
  const matches = ctx.invokedFunctionArn.match(/\d{3,}/);
  if (matches && matches.length) {
    awsAccountId = matches[0];
  }

  await sns
    .publish({
      Message: JSON.stringify(body),
      TopicArn: `arn:aws:sns:${AWS_CURRENT_REGION}:${awsAccountId}:CreatePDF`,
    })
    .promise();
  return {
    statusCode: 200,
  };
};
