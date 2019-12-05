"use strict";

const API_URL = "https://api.github.com/repos";

function buildDeployUrl(org, repo) {
  return `${API_URL}/${org}/${repo}/deployments`;
}

function buildDeployStatusUrl(org, repo, id) {
  return `${buildDeployUrl(org, repo)}/${id}/statuses`;
}

module.exports = {
  buildDeployUrl,
  buildDeployStatusUrl
};
