import SHA256 from 'crypto-js/sha256';
import HmacSHA256 from 'crypto-js/hmac-sha256';
import encHex from 'crypto-js/enc-hex';
import URL from 'url-parse';

const AWS_SHA_256 = 'AWS4-HMAC-SHA256';
const AWS4_REQUEST = 'aws4_request';
const X_AMZ_DATE = 'x-amz-date';
const X_AMZ_SECURITY_TOKEN = 'x-amz-security-token';
const HOST = 'host';
const AUTHORIZATION = 'Authorization';

function hash(value) {
  return SHA256(value);
}

function hexEncode(value) {
  return value.toString(encHex);
}

function hmac(secret, value) {
  return HmacSHA256(value, secret, {asBytes: true});
}

function buildCanonicalRequest(method, path, queryParams, headers, payload) {
  return method + '\n' +
    buildCanonicalUri(path) + '\n' +
    buildCanonicalQueryString(queryParams) + '\n' +
    buildCanonicalHeaders(headers) + '\n' +
    buildCanonicalSignedHeaders(headers) + '\n' +
    hexEncode(hash(payload));
}

function hashCanonicalRequest(request) {
  return hexEncode(hash(request));
}

function buildCanonicalUri(uri) {
  return encodeURI(uri);
}

function buildCanonicalQueryString(queryParams) {
  if (Object.keys(queryParams).length < 1) {
    return '';
  }

  var sortedQueryParams = [];
  for (var property in queryParams) {
    if (queryParams.hasOwnProperty(property)) {
      sortedQueryParams.push(property);
    }
  }
  sortedQueryParams.sort();

  var canonicalQueryString = '';
  for (var i = 0; i < sortedQueryParams.length; i++) {
    canonicalQueryString += sortedQueryParams[i] + '=' + encodeURIComponent(queryParams[sortedQueryParams[i]]) + '&';
  }
  return canonicalQueryString.substr(0, canonicalQueryString.length - 1);
}

function buildCanonicalHeaders(headers) {
  var canonicalHeaders = '';
  var sortedKeys = [];
  for (var property in headers) {
    if (headers.hasOwnProperty(property)) {
      sortedKeys.push(property);
    }
  }
  sortedKeys.sort();

  for (var i = 0; i < sortedKeys.length; i++) {
    canonicalHeaders += sortedKeys[i].toLowerCase() + ':' + headers[sortedKeys[i]] + '\n';
  }
  return canonicalHeaders;
}

function buildCanonicalSignedHeaders(headers) {
  var sortedKeys = [];
  for (var property in headers) {
    if (headers.hasOwnProperty(property)) {
      sortedKeys.push(property.toLowerCase());
    }
  }
  sortedKeys.sort();

  return sortedKeys.join(';');
}

function buildStringToSign(datetime, credentialScope, hashedCanonicalRequest) {
  return AWS_SHA_256 + '\n' +
    datetime + '\n' +
    credentialScope + '\n' +
    hashedCanonicalRequest;
}

function buildCredentialScope(datetime, region, service) {
  return datetime.substr(0, 8) + '/' + region + '/' + service + '/' + AWS4_REQUEST
}

function calculateSigningKey(secretKey, datetime, region, service) {
  return hmac(hmac(hmac(hmac('AWS4' + secretKey, datetime.substr(0, 8)), region), service), AWS4_REQUEST);
}

function calculateSignature(key, stringToSign) {
  return hexEncode(hmac(key, stringToSign));
}

function buildAuthorizationHeader(accessKey, credentialScope, headers, signature) {
  return AWS_SHA_256 + ' Credential=' + accessKey + '/' + credentialScope + ', SignedHeaders=' + buildCanonicalSignedHeaders(headers) + ', Signature=' + signature;
}

function transformData(request) {
  let data = request.data;
  if (Array.isArray(request.transformRequest)) {
    request.transformRequest.forEach((transformer) => {
      data = transformer(data);
    });
  } else {
    data = request.transformRequest(data);
  }
  return data;
}

class AWS4 {
  constructor(options) {
    const defaults = {
      region: 'us-east-1',
      service: 'execute-api'
    };
    Object.assign(this, defaults, options);
  }

  sign(request, creds) {
    const url = new URL(request.url);
    const datetime = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/[:\-]|\.\d{3}/g, '');

    request.params = request.params || {};
    request.data = transformData(request);
    request.headers[X_AMZ_DATE] = datetime;
    request.headers[HOST] = url.hostname;

    let canonicalRequest = buildCanonicalRequest(request.method, url.pathname, request.params, request.headers, request.data || '');
    let hashedCanonicalRequest = hashCanonicalRequest(canonicalRequest);
    let credentialScope = buildCredentialScope(datetime, this.region, this.service);
    let stringToSign = buildStringToSign(datetime, credentialScope, hashedCanonicalRequest);
    let signingKey = calculateSigningKey(creds.secretAccessKey, datetime, this.region, this.service);
    let signature = calculateSignature(signingKey, stringToSign);

    request.headers[AUTHORIZATION] = buildAuthorizationHeader(creds.accessKeyId, credentialScope, request.headers, signature);
    if(creds.sessionToken) request.headers[X_AMZ_SECURITY_TOKEN] = creds.sessionToken;

    delete request.headers[HOST];

    return request;
  }
}

export default AWS4;