const subject = require("../index");

let mockUi;

beforeEach(function() {
  mockUi = {
    verbose: true,
    messages: [],
    write: function() {},
    writeLine: function(message) {
      this.messages.push(message);
    }
  };
});

test("updates the deploment status on failure", async function() {
  const instance = subject.createDeployPlugin({
    name: "github-deployment-status"
  });

  const config = {
    org: "foo",
    repo: "bar",
    ref: "baz",
    token: "token",
    targetUrl: "https://support.kayakostage.net"
  };

  const context = {
    ui: mockUi,
    config: {
      "github-deployment-status": config
    },
    "github-deployment-status": { deploymentId: "123" },
    _fakeRequest: {
      request(options) {
        this._options = options;

        return Promise.resolve();
      }
    }
  };

  instance.beforeHook(context);
  instance.configure(context);
  instance.setup(context);

  await instance.didFail(context);

  const options = context["github-deployment-status"]._client._options;

  expect(options.uri).toEqual(
    "https://api.github.com/repos/foo/bar/deployments/123/statuses"
  );
  expect(options.method).toEqual("POST");
  expect(options.json).toEqual(true);
  expect(options.qs).toEqual({ access_token: "token" });
  expect(options.headers).toEqual({ "User-Agent": "foo" });
  expect(options.body).toEqual({
    state: "failure",
    target_url: "https://support.kayakostage.net",
    description: "Deploy failed"
  });
});

test("doesn't attempt to update deployment if there was an error creating it", async function() {
  const instance = subject.createDeployPlugin({
    name: "github-deployment-status"
  });

  const config = {
    org: "foo",
    repo: "bar",
    ref: "baz",
    token: "token",
    targetUrl: "https://support.kayakostage.net"
  };

  const context = {
    ui: mockUi,
    config: {
      "github-deployment-status": config
    },
    "github-deployment-status": { deploymentId: null },
    _fakeRequest: {
      request(options) {
        this._options = options;

        return Promise.resolve();
      }
    }
  };

  instance.beforeHook(context);
  instance.configure(context);
  instance.setup(context);

  await instance.didFail(context);

  expect(context["github-deployment-status"]._client._options).toBeUndefined();
});
