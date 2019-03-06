import {
  AuthOptions,
  Headers,
  LoadEvent,
  NavigationOptions,
  PDFOptions,
  WaitForSelectorOptions,
} from 'puppeteer-core';

export interface ICreatePdfOptions {
  url: string;
  s3Url?: string;
  headers?: Headers;
  pdfOptions?: PDFOptions;
  basicAuth?: AuthOptions;
  waitUntil?: LoadEvent;
  selector?: string;
}
