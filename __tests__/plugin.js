const subject = require("../index");

test("has a name", function() {
  var instance = subject.createDeployPlugin({
    name: "foo"
  });

  expect(instance.name).toBe("foo");
});

test("implements the correct hooks", function() {
  const plugin = subject.createDeployPlugin({
    name: "foo"
  });

  expect(plugin.setup).toBeDefined();
  expect(plugin.setup).toBeInstanceOf(Function);

  expect(plugin.willDeploy).toBeDefined();
  expect(plugin.willDeploy).toBeInstanceOf(Function);

  expect(plugin.didDeploy).toBeDefined();
  expect(plugin.didDeploy).toBeInstanceOf(Function);

  expect(plugin.didFail).toBeDefined();
  expect(plugin.didFail).toBeInstanceOf(Function);
});
