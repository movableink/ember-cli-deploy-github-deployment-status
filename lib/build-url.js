"use strict";

const HOST_NAME = "api.github.com/repos";

function buildDeployUrl(org, repo) {
  return `/${org}/${repo}/deployments`;
}

function buildDeployStatusUrl(org, repo, id) {
  return `${buildDeployUrl(org, repo)}/${id}/statuses`;
}

module.exports = {
  HOST_NAME,
  buildDeployUrl,
  buildDeployStatusUrl
};
