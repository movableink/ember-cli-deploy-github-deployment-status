const subject = require("../../index");
const { buildDeployStatusUrl } = require("../../lib/build-url");

let instance, mockUi;

beforeEach(function() {
  mockUi = {
    verbose: true,
    messages: [],
    write: function() {},
    writeLine: function(message) {
      this.messages.push(message);
    }
  };

  instance = subject.createDeployPlugin({
    name: "github-deployment-status"
  });

  jest.spyOn(instance, "_request").mockImplementation(() => Promise.resolve());
});

test("updates the deployment status on failure", async function() {
  const config = {
    org: "foo",
    repo: "bar",
    ref: "baz",
    token: "token",
    logUrl: "https://support.kayakostage.net"
  };

  const context = {
    ui: mockUi,
    config: {
      "github-deployment-status": config
    },
    "github-deployment-status": { deploymentId: "123" }
  };

  instance.beforeHook(context);
  instance.configure(context);

  await instance.didFail(context);

  expect(instance._request).toBeCalledWith(
    buildDeployStatusUrl("foo", "bar", "123"),
    {
      headers: { "User-Agent": "foo" },
      queryString: { access_token: "token" },
      body: {
        state: "failure",
        log_url: "https://support.kayakostage.net",
        description: "Deploy failed"
      }
    }
  );
});

test("doesn't attempt to update deployment if there was an error creating it", async function() {
  const config = {
    org: "foo",
    repo: "bar",
    ref: "baz",
    token: "token",
    logUrl: "https://support.kayakostage.net"
  };

  const context = {
    ui: mockUi,
    config: {
      "github-deployment-status": config
    },
    "github-deployment-status": { deploymentId: null }
  };

  instance.beforeHook(context);
  instance.configure(context);

  await instance.didFail(context);

  expect(instance._request).not.toBeCalled();
});
