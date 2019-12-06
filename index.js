"use strict";

const BasePlugin = require("ember-cli-deploy-plugin");
const { buildDeployUrl, buildDeployStatusUrl } = require("./lib/build-url");
const request = require("./lib/request");

module.exports = {
  name: "ember-cli-deploy-github-deployment-status",

  createDeployPlugin(options) {
    const Plugin = BasePlugin.extend({
      name: options.name,

      // Injected for easier stubbing in tests
      _request: request,

      requiredConfig: ["org", "repo", "ref"],

      defaultConfig: {
        token: null,
        task: "deploy",
        autoMerge: false,
        requiredContexts: [],
        payload: null,
        environment: "production",
        logUrl: null,
        deploymentId: null,
        description: "",
        environmentUrl: "",
        autoInactive: true
      },

      async willDeploy() {
        const pluginName = this.name;
        const token = this.readConfig("token");
        const org = this.readConfig("org");
        const repo = this.readConfig("repo");
        const ref = this.readConfig("ref");
        const environment = this.readConfig("environment");
        const description = this.readConfig("description");
        const autoMerge = this.readConfig("autoMerge");
        const contexts = this.readConfig("requiredContexts");
        const payload = this.readConfig("payload");

        const deploymentId = this.readConfig("deploymentId");
        let data;

        try {
          if (deploymentId) {
            data = { id: deploymentId };
          } else {
            const body = {
              ref: ref,
              auto_merge: autoMerge,
              required_contexts: contexts,
              environment,
              description
            };

            if (payload) {
              body.payload = payload;
            }

            const options = {
              headers: {
                "User-Agent": org
              },
              body
            };

            if (token) {
              options.queryString = { access_token: token };
            }
            data = await this._request(buildDeployUrl(org, repo), options);
          }

          const response = {};
          response[pluginName] = { deploymentId: data.id };

          return response;
        } catch (error) {
          this.log("Error creating github deployment: " + error.message, {
            verbose: true,
            color: "yellow"
          });

          const response = {};
          response[pluginName] = { deploymentId: null };

          return response;
        }
      },

      didDeploy(context) {
        const pluginName = this.name;
        const id = context[pluginName].deploymentId;

        return this._updateDeployment(id, "success", "Deployed successfully");
      },

      didFail(context) {
        const pluginName = this.name;
        const id = context[pluginName].deploymentId;

        return this._updateDeployment(id, "failure", "Deploy failed");
      },

      _updateDeployment(id, state, description) {
        const token = this.readConfig("token");
        const org = this.readConfig("org");
        const repo = this.readConfig("repo");
        const logUrl = this.readConfig("logUrl");

        if (id) {
          const body = {
            state,
            description,
            environment_url: this.readConfig("environmentUrl"),
            auto_inactive: this.readConfig("autoInactive")
          };

          if (logUrl) {
            body.log_url = logUrl;
          }

          const options = {
            headers: {
              "User-Agent": org
            },
            body
          };

          if (token) {
            options.queryString = { access_token: token };
          }

          return this._request(buildDeployStatusUrl(org, repo, id), options);
        }

        return Promise.resolve();
      }
    });

    return new Plugin();
  }
};
