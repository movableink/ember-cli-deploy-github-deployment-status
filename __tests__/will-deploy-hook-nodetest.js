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

describe("deploymentId is provided", function() {
  test("sets the deployment id on the context without making a request", async function() {
    const instance = subject.createDeployPlugin({
      name: "github-deployment-status"
    });

    const config = {
      org: "foo",
      repo: "bar",
      ref: "baz",
      token: "token",
      deploymentId: "9"
    };

    const request = jest.fn();

    const context = {
      ui: mockUi,
      config: {
        "github-deployment-status": config
      },
      _fakeRequest: {
        request
      }
    };

    instance.beforeHook(context);
    instance.configure(context);
    instance.setup(context);

    const result = await instance.willDeploy(context);

    expect(result["github-deployment-status"].deploymentId).toBe("9");
    expect(request).not.toBeCalled();
  });
});

describe("deploymentId is not provided", function() {
  test("creates a new deployment", async function() {
    const instance = subject.createDeployPlugin({
      name: "github-deployment-status"
    });

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
      },
      _fakeRequest: {
        request(options) {
          this._options = options;

          return Promise.resolve({ id: "123" });
        }
      }
    };

    instance.beforeHook(context);
    instance.configure(context);
    instance.setup(context);

    const result = await instance.willDeploy(context);

    const options = context["github-deployment-status"]._client._options;

    expect(options.uri).toBe(
      "https://api.github.com/repos/foo/bar/deployments"
    );
    expect(options.method).toBe("POST");
    expect(options.json).toBe(true);
    expect(options.qs).toEqual({ access_token: "token" });
    expect(options.headers).toEqual({ "User-Agent": "foo" });
    expect(options.body).toEqual({
      ref: "baz",
      auto_merge: false,
      required_contexts: [],
      environment: "production",
      description: "Deploying"
    });
    expect(result["github-deployment-status"].deploymentId).toBe("123");
  });

  test("rejects if an error occured creating deployment", async function() {
    const instance = subject.createDeployPlugin({
      name: "github-deployment-status"
    });

    const config = {
      org: "foo",
      repo: "bar",
      ref: "baz"
    };

    const context = {
      ui: mockUi,
      config: {
        "github-deployment-status": config
      },
      _fakeRequest: {
        request() {
          return Promise.reject("BOOM");
        }
      }
    };

    instance.beforeHook(context);
    instance.configure(context);
    instance.setup(context);

    const result = await instance.willDeploy(context);

    expect(mockUi.messages.pop()).toMatch(
      /Error creating github deployment: BOOM/
    );
    expect(result["github-deployment-status"].deploymentId).toBeNull();
  });
});
