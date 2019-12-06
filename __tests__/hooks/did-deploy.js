const subject = require("../../index");
const { buildDeployStatusUrl } = require("../../lib/build-url");

let mockUi, instance;

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

test("updates the deploment status on success", async function() {
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

  await instance.didDeploy(context);

  expect(instance._request).toBeCalledWith(
    buildDeployStatusUrl("foo", "bar", "123"),
    {
      headers: { "User-Agent": "foo" },
      queryString: { access_token: "token" },
      body: {
        state: "success",
        log_url: "https://support.kayakostage.net",
        description: "Deployed successfully",
        environment_url: "",
        auto_inactive: true
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

  await instance.didDeploy(context);

  expect(instance._request).not.toBeCalled();
});
