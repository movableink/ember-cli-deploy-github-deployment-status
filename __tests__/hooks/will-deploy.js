const subject = require("../../index");
const { buildDeployUrl } = require("../../lib/build-url");

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

describe("deploymentId is provided", function() {
  test("sets the deployment id on the context without making a request", async function() {
    const instance = subject.createDeployPlugin({
      name: "github-deployment-status"
    });

    jest.spyOn(instance, "_request");

    const config = {
      org: "foo",
      repo: "bar",
      ref: "baz",
      token: "token",
      deploymentId: "9"
    };

    const context = {
      ui: mockUi,
      config: {
        "github-deployment-status": config
      }
    };

    instance.beforeHook(context);
    instance.configure(context);

    const result = await instance.willDeploy(context);

    expect(instance._request).not.toBeCalled();
    expect(result).toEqual({
      "github-deployment-status": { deploymentId: "9" }
    });
  });
});

describe("deploymentId is not provided", function() {
  test("creates a new deployment", async function() {
    const instance = subject.createDeployPlugin({
      name: "github-deployment-status"
    });

    jest
      .spyOn(instance, "_request")
      .mockImplementation(() => Promise.resolve({ id: "123" }));

    const config = {
      org: "foo",
      repo: "bar",
      ref: "baz",
      token: "token"
    };

    const context = {
      ui: mockUi,
      config: {
        "github-deployment-status": config
      }
    };

    instance.beforeHook(context);
    instance.configure(context);

    const result = await instance.willDeploy(context);

    expect(instance._request).toBeCalledWith(buildDeployUrl("foo", "bar"), {
      headers: { "User-Agent": "foo" },
      queryString: { access_token: "token" },
      body: {
        ref: "baz",
        auto_merge: false,
        required_contexts: [],
        environment: "production",
        description: ""
      }
    });

    expect(result).toEqual({
      "github-deployment-status": { deploymentId: "123" }
    });
  });

  test("rejects if an error occured creating deployment", async function() {
    const instance = subject.createDeployPlugin({
      name: "github-deployment-status"
    });

    jest
      .spyOn(instance, "_request")
      .mockImplementation(() => Promise.reject(new Error("BOOM")));

    const config = {
      org: "foo",
      repo: "bar",
      ref: "baz"
    };

    const context = {
      ui: mockUi,
      config: {
        "github-deployment-status": config
      }
    };

    instance.beforeHook(context);
    instance.configure(context);

    const result = await instance.willDeploy(context);

    expect(mockUi.messages.pop()).toMatch(
      /Error creating github deployment: BOOM/
    );
    expect(result).toEqual({
      "github-deployment-status": { deploymentId: null }
    });
  });
});
