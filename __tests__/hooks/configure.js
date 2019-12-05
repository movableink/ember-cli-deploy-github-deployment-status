const subject = require("../../index");

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

describe("required config", function() {
  let config;

  beforeEach(function() {
    config = {
      org: "foo",
      repo: "bar",
      ref: "baz"
    };
  });

  test.each(["org", "repo", "ref"])("warns about missing", function(prop) {
    const instance = subject.createDeployPlugin({
      name: "github-deployment-status"
    });

    delete config[prop];

    const context = {
      ui: mockUi,
      config: {
        "github-deployment-status": config
      }
    };

    instance.beforeHook(context);

    expect(function() {
      instance.configure(context);
    }).toThrow();

    const s = "Missing required config: `" + prop + "`";
    expect(mockUi.messages.pop()).toMatch(new RegExp(s));
  });
});

describe("default config", function() {
  let config;

  beforeEach(function() {
    config = {
      org: "foo",
      repo: "bar",
      ref: "baz"
    };
  });

  test.each(["token", "payload", "logUrl", "deploymentId"])(
    "provides default",
    function(prop) {
      const instance = subject.createDeployPlugin({
        name: "github-deployment-status"
      });

      const context = {
        ui: mockUi,
        config: {
          "github-deployment-status": config
        }
      };

      instance.beforeHook(context);
      instance.configure(context);

      expect(instance.readConfig(prop)).toBe(null);
    }
  );

  test("provides default task", function() {
    const instance = subject.createDeployPlugin({
      name: "github-deployment-status"
    });

    const context = {
      ui: mockUi,
      config: {
        "github-deployment-status": config
      }
    };

    instance.beforeHook(context);
    instance.configure(context);

    expect(instance.readConfig("task")).toBe("deploy");
  });

  test("provides default autoMerge", function() {
    const instance = subject.createDeployPlugin({
      name: "github-deployment-status"
    });

    const context = {
      ui: mockUi,
      config: {
        "github-deployment-status": config
      }
    };

    instance.beforeHook(context);
    instance.configure(context);

    expect(instance.readConfig("autoMerge")).toBe(false);
  });

  test("provides default requiredContexts", function() {
    const instance = subject.createDeployPlugin({
      name: "github-deployment-status"
    });

    const context = {
      ui: mockUi,
      config: {
        "github-deployment-status": config
      }
    };

    instance.beforeHook(context);
    instance.configure(context);

    expect(instance.readConfig("requiredContexts")).toEqual([]);
  });

  it("provides default environment", function() {
    const instance = subject.createDeployPlugin({
      name: "github-deployment-status"
    });

    const context = {
      ui: mockUi,
      config: {
        "github-deployment-status": config
      }
    };

    instance.beforeHook(context);
    instance.configure(context);

    expect(instance.readConfig("environment")).toBe("production");
  });
});
