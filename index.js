"use strict";

const BasePlugin = require("ember-cli-deploy-plugin");
const { buildDeployUrl, buildDeployStatusUrl } = require("./lib/build-url");

const CUSTOM_ACCEPT =
  "application/vnd.github.ant-man-preview+json,application/vnd.github.flash-preview+json";

module.exports = {
  name: "ember-cli-deploy-github-deployment-status",

  createDeployPlugin(options) {
    const Plugin = BasePlugin.extend({
      name: options.name,

      requiredConfig: ["org", "repo", "ref"],

      defaultConfig: {
        token: null,
        task: "deploy",
        autoMerge: false,
        requiredContexts: [],
        payload: null,
        environment: "production",
        logUrl: null,
        deploymentId: null
      },

      setup(context) {
        context[this.name] = context[this.name] || {};
        context[this.name]._client = context._fakeRequest || {
          request: require("request-promise")
        };
      },

      willDeploy(context) {
        const pluginName = this.name;
        const token = this.readConfig("token");
        const org = this.readConfig("org");
        const repo = this.readConfig("repo");
        const ref = this.readConfig("ref");
        const environment = this.readConfig("environment");
        const autoMerge = this.readConfig("autoMerge");
        const contexts = this.readConfig("requiredContexts");
        const payload = this.readConfig("payload");

        const deploymentId = this.readConfig("deploymentId");
        let promise;

        if (deploymentId) {
          promise = Promise.resolve({ id: deploymentId });
        } else {
          const client = context[pluginName]._client;

          const body = {
            ref: ref,
            auto_merge: autoMerge,
            required_contexts: contexts,
            environment: environment,
            description: "Deploying"
          };

          if (payload) {
            body.payload = payload;
          }

          const options = {
            method: "POST",
            uri: buildDeployUrl(org, repo),
            headers: {
              Accept: CUSTOM_ACCEPT,
              "User-Agent": org
            },
            body: body,
            json: true
          };

          if (token) {
            options.qs = { access_token: token };
          }

          promise = client.request(options);
        }

        return promise.then(
          function(data) {
            const response = {};
            response[pluginName] = { deploymentId: data.id };

            return response;
          },
          function(reason) {
            this.log("Error creating github deployment: " + reason, {
              verbose: true,
              color: "yellow"
            });
            const response = {};
            response[pluginName] = { deploymentId: null };

            return response;
          }.bind(this)
        );
      },

      didDeploy(context) {
        const pluginName = this.name;
        const id = context[pluginName].deploymentId;

        const client = context[pluginName]._client;

        return this._updateDeployment.call(
          this,
          id,
          "success",
          "Deployed successfully",
          client
        );
      },

      didFail(context) {
        const pluginName = this.name;
        const id = context[pluginName].deploymentId;

        const client = context[pluginName]._client;

        return this._updateDeployment.call(
          this,
          id,
          "failure",
          "Deploy failed",
          client
        );
      },

      _updateDeployment(id, state, description, client) {
        const token = this.readConfig("token");
        const org = this.readConfig("org");
        const repo = this.readConfig("repo");
        const logUrl = this.readConfig("logUrl");

        if (id) {
          const body = { state: state, description: description };

          if (logUrl) {
            body.log_url = logUrl;
          }

          const options = {
            method: "POST",
            uri: buildDeployStatusUrl(org, repo, id),
            headers: {
              Accept: CUSTOM_ACCEPT,
              "User-Agent": org
            },
            body: body,
            json: true
          };

          if (token) {
            options.qs = { access_token: token };
          }

          return client.request(options);
        }

        return Promise.resolve();
      }
    });

    return new Plugin();
  }
};
