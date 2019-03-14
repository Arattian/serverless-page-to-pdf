import { APIGatewayEvent, Context, Handler } from 'aws-lambda';
import { SNS } from 'aws-sdk';
import { ClientConfiguration } from 'aws-sdk/clients/sns';
import { isUrl } from './is-url';
const {
  AWS_CURRENT_REGION,
  IS_OFFLINE,
  SNS_PORT,
  SLS_HOST_IP,
  AWS_CURRENT_STAGE,
} = process.env;

const options: ClientConfiguration = { maxRetries: 1 };

if (IS_OFFLINE) {
  options.endpoint = SLS_HOST_IP
    ? `http://${SLS_HOST_IP}:${SNS_PORT}`
    : `http://127.0.0.1:${SNS_PORT}`;
  options.region = AWS_CURRENT_REGION;
}

const sns = new SNS(options);

const getAWSAccountId = (ctx: Context) => {
  const matches = ctx.invokedFunctionArn.match(/\d{3,}/);
  if (matches && matches.length) {
    return matches[0];
  }
  return '*';
};

const broadcast = async (event: string, message: string, ctx: Context) => {
  return sns
    .publish({
      Message: message,
      TopicArn: `arn:aws:sns:${AWS_CURRENT_REGION}:${
        IS_OFFLINE ? '123456789012' : getAWSAccountId(ctx)
      }:${AWS_CURRENT_STAGE}${event}`,
    })
    .promise();
};

export const ts: Handler = async (evt: APIGatewayEvent, ctx: Context) => {
  let body;

  if (evt.body == null) {
    throw new Error('Missing request body');
  }

  body = evt.isBase64Encoded
    ? JSON.parse(Buffer.from(evt.body, 'base64').toString())
    : JSON.parse(evt.body);

  const { url, s3Url } = body;

  if (!isUrl(url)) {
    throw new Error('Request body must contain valid url');
  }

  if (!isUrl(s3Url)) {
    throw new Error('Request body must contain valid s3 url');
  }

  await broadcast('CreatePDF', JSON.stringify(body), ctx);
  return {
    statusCode: 200,

    body: JSON.stringify({
      message: 'Creating PDF',
    }),
  };
};
