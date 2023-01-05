import findIndex from "@dword-design/functions/dist/find-index.js";
import omit from "@dword-design/functions/dist/omit.js";
export default (async (body, options, transport) => {
  body = {
    config: 0,
    ...body
  };
  if (typeof body.config === 'string') {
    const configIndex = findIndex(_ => _.name === body.config)(options.message);
    if (configIndex === -1) {
      throw new Error(`Message config with name '${body.config}' not found.`);
    }
    body.config = configIndex;
  } else if (!options.message[body.config]) {
    throw new Error(`Message config not found at index ${body.config}.`);
  }
  await transport.sendMail({
    ...omit(['config', 'to', 'cc', 'bcc'])(body),
    ...omit(['name'])(options.message[body.config])
  });
});