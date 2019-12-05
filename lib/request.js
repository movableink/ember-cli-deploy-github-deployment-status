"use strict";

const { format: formatUrl } = require("url");
const nodeFetch = require("node-fetch");
const { HOST_NAME } = require("./build-url");

const DEFAULT_HEADERS = {
  Accept: [
    "application/vnd.github.ant-man-preview+json",
    "application/vnd.github.flash-preview+json"
  ]
};

async function request(
  path,
  { body, headers = {}, queryString, ...rest } = {}
) {
  const url = formatUrl({
    protocol: "https",
    hostname: HOST_NAME,
    pathname: path,
    query: queryString
  });

  const response = await nodeFetch(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      ...DEFAULT_HEADERS,
      ...headers
    },
    ...rest
  });

  const responseBody = await response.json();

  if (response.ok) {
    return responseBody;
  } else {
    throw new Error(responseBody.message);
  }
}

module.exports = request;
module.exports.DEFAULT_HEADERS = DEFAULT_HEADERS;
