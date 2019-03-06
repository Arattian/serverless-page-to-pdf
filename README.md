# Serverless Page to PDF

Highly customizable, ready to deploy serverless AWS API to extract pdf of webpages.

## Installation

```sh
npm i
```

Serverless API Deployment. Make sure before deployment you set your credentials in profile

```sh
npm run deploy
```

### Usage

API serves your POST requests and returns pdf of provided url.
Request will have JSON body like this.

```javascript
{
	"url": "https://google.com", /* required */
	"s3Url": "value", /* optional (S3 bucket url to upload pdf. If not provided, it will return generated pdf) */
	"basicAuth": { /* optional (if url contain basic authentication, puppeteer will try to authenticate) */
		"username": "your username",
		"password": "your password",
	},
	"headers": { /* optional (requested url headers, like you send in normal requests to that url) */
		"x-api-key": "someapikey",
		"...": "..."
	},
	"pdfOptions": { /* optional (custom pdfOptions) */
		"format": "A4", /* default */
		"printBackground": true /* default */
	},
	"waitUntil": "value", /* optional (supported values "load","domcontentloaded",("networkidle0" - default),"networkidle2" */
	"selector": "value" /* optional (css selector to wait) */
}
```

[PDF Options](https://github.com/GoogleChrome/puppeteer/blob/v1.12.2/docs/api.md#pagepdfoptions)

Note: Headless_shell version must match the version of chrome that is set in puppeteer v1.11.0.
Please do not update puppeteer to last version,
that will cause fail to launch chrome and endpoint request timeout.
