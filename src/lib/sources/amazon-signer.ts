// AWS SigV4 signer for Amazon PA-API 5.0.
// Uses Node's built-in `crypto` module — no external dependencies.
import { createHmac, createHash } from "crypto";

export interface SignedHeaders {
  Authorization: string;
  "x-amz-date": string;
  "x-amz-target": string;
  "content-encoding": string;
  "content-type": string;
  host: string;
}

function sha256hex(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

function getSigningKey(secretKey: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = hmacSha256(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  return hmacSha256(kService, "aws4_request");
}

export function signPaApiRequest(opts: {
  host: string;
  region: string;
  path: string;
  target: string;
  payload: string;
  accessKey: string;
  secretKey: string;
}): SignedHeaders {
  const { host, region, path, target, payload, accessKey, secretKey } = opts;
  const service = "ProductAdvertisingAPI";

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z"; // YYYYMMDDTHHmmssZ
  const dateStamp = amzDate.slice(0, 8); // YYYYMMDD

  const contentType = "application/json; charset=utf-8";
  const contentEncoding = "amz-1.0";

  // Canonical headers must be sorted and lowercased.
  const canonicalHeaders =
    `content-encoding:${contentEncoding}\n` +
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:${target}\n`;

  const signedHeaderNames = "content-encoding;content-type;host;x-amz-date;x-amz-target";

  const canonicalRequest = [
    "POST",
    path,
    "", // no query string
    canonicalHeaders,
    signedHeaderNames,
    sha256hex(payload),
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256hex(canonicalRequest),
  ].join("\n");

  const signingKey = getSigningKey(secretKey, dateStamp, region, service);
  const signature = createHmac("sha256", signingKey).update(stringToSign, "utf8").digest("hex");

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaderNames}, Signature=${signature}`;

  return {
    Authorization: authorization,
    "x-amz-date": amzDate,
    "x-amz-target": target,
    "content-encoding": contentEncoding,
    "content-type": contentType,
    host,
  };
}
