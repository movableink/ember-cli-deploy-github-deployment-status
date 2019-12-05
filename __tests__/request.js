const nock = require("nock");
const request = require("../lib/request");

const { HOST_NAME, buildDeployUrl } = require("../lib/build-url");

const HOST_WITH_PROTOCOL = `https://${HOST_NAME}`;
const PATH = buildDeployUrl("foo", "bar");

afterEach(nock.cleanAll);

test("making a basic request", async () => {
  const handler = jest.fn(() => ({ ok: true }));
  nock(HOST_WITH_PROTOCOL)
    .post(PATH)
    .reply(200, handler);

  const response = await request(PATH);

  expect(response).toEqual({ ok: true });
  expect(handler).toBeCalled();
});

test("attaching a query string to the URL", async () => {
  const handler = jest.fn(() => 200);
  nock(HOST_WITH_PROTOCOL)
    .post(`${PATH}?foo=bar`)
    .reply(200, handler);

  await request(PATH, { queryString: { foo: "bar" } });

  expect(handler).toBeCalled();
});

test("posting a body to the API", async () => {
  const handler = jest.fn(() => 200);
  nock(HOST_WITH_PROTOCOL)
    .post(PATH)
    .reply(200, handler);

  await request(PATH, { body: { foo: "bar" } });

  expect(handler).toBeCalledWith(expect.anything(), '{"foo":"bar"}');
});

test("overriding default settings", async () => {
  const handler = jest.fn(() => 200);
  nock(HOST_WITH_PROTOCOL)
    .get(PATH)
    .reply(200, handler);

  await request(PATH, { method: "GET" });

  expect(handler).toBeCalled();
});

test("setting additional headers on the request", async () => {
  const handler = jest.fn(() => 200);
  nock(HOST_WITH_PROTOCOL)
    .post(PATH)
    .reply(200, handler);

  await request(PATH, { headers: { Foo: "bar" } });

  const requestHeaders = handler.mock.instances[0].req.headers;

  expect(requestHeaders.foo).toEqual(["bar"]);
  expect(requestHeaders.accept).toEqual([
    request.DEFAULT_HEADERS.Accept.join(",")
  ]);
});

test("handling an error", async () => {
  const message = "Conflict merging master into topic-branch";
  const handler = jest.fn(() => ({
    message
  }));
  nock(HOST_WITH_PROTOCOL)
    .post(PATH)
    .reply(409, handler);

  await expect(request(PATH, { headers: { Foo: "bar" } })).rejects.toEqual(
    new Error(message)
  );
});
