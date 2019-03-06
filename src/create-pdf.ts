import { APIGatewayEvent, Context, Handler } from 'aws-lambda';
import { SNS } from 'aws-sdk';
import { isUrl } from './is-url';
const { AWS_CURRENT_REGION, AWS_CURRENT_STAGE, SNS_PORT } = process.env;

export const ts: Handler = async (evt: APIGatewayEvent, ctx: Context) => {
  let body;

  if (evt.body == null) {
    throw new Error('Missing request body');
  }

  try {
    body = evt.isBase64Encoded
      ? JSON.parse(Buffer.from(evt.body, 'base64').toString())
      : JSON.parse(evt.body);
  } catch (error) {
    throw new Error(error.message);
  }

  const { url, s3Url } = body;

  if (!isUrl(url)) {
    throw new Error('Request body must contain valid url');
  } else if (s3Url && !isUrl(s3Url)) {
    throw new Error('Request body must contain valid s3 url');
  }

  let sns = new SNS({ maxRetries: 1 });

  if (AWS_CURRENT_STAGE === 'local') {
    sns = new SNS({
      endpoint: `http://127.0.0.1:${SNS_PORT}`,
      region: AWS_CURRENT_REGION,
    });
  }

  let awsAccountId = '123456789012';
  const matches = ctx.invokedFunctionArn.match(/\d{3,}/);
  if (matches && matches.length) {
    awsAccountId = matches[0];
  }

  return sns
    .publish({
      Message: JSON.stringify(body),
      TopicArn: `arn:aws:sns:${AWS_CURRENT_REGION}:${awsAccountId}:CreatePDF`,
    })
    .promise();
};
