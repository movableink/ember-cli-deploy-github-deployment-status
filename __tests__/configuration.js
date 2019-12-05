const subject = require("../index");

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

describe("`environmentUrl`", () => {
  test("when the value is a string", async function() {
    const config = {
      org: "foo",
      repo: "bar",
      ref: "baz",
      token: "token",
      logUrl: "https://support.kayakostage.net",
      environmentUrl: "https://foobar.com"
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
      expect.anything(),
      expect.objectContaining({
        body: expect.objectContaining({
          environment_url: "https://foobar.com"
        })
      })
    );
  });

  test("when the value is a function", async function() {
    const config = {
      org: "foo",
      repo: "bar",
      ref: "baz",
      token: "token",
      logUrl: "https://support.kayakostage.net",
      environmentUrl({ config }) {
        const { ref } = config["github-deployment-status"];
        return `https://foobar.com?ref=${ref}`;
      }
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
      expect.anything(),
      expect.objectContaining({
        body: expect.objectContaining({
          environment_url: "https://foobar.com?ref=baz"
        })
      })
    );
  });
});
