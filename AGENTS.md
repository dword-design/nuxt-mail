# AGENTS.md

## Code style
- Write everything in TypeScript
- The project uses strict typing
- Only add an explicit type if it's needed
  - If it's otherwise resolved to `any`
  - Don't add a return type if it can be resolved form the return statements in the function
- Use arrow functions instead of `function` if possible
- End each statement with a semicolon
- Use declarative programming instead of procedural
  - Instead of pushing into an array, declare the array as a whole. For conditional elements, use `['a', ...cond ? ['b'] : []]`
  - Instead of adding fields into an object, declare the object as a whole. For conditional elements, use `{ a: 'foo', ...cond && { b: 'bar' } }`
- Add `async` to a function if and only if it has at least one `await` expression
- Use CONSTANT_CASE for constants

## Best practices
- Generally use libraries instead of reinventing the wheel
- Use async variants of functions if possible
- Use [fs-extra](https://www.npmjs.com/package/fs-extra) package instead of `node:fs/promises`
  - Use `fs` default export
  - Use `fs.outputFile` to write a file if it's not clear if the parent folder exists
- Use [execa](https://www.npmjs.com/search?q=execa) to run processes
- Use [delay](https://www.npmjs.com/package/delay) for delays
- Use [lodash-es](https://www.npmjs.com/package/lodash-es) for utilities
- As a headless browser, use [playwright](https://www.npmjs.com/package/playwright)
  - Install chromium via [@playwright/browser-chromium](https://www.npmjs.com/package/@playwright/browser-chromium) so that it auto-installs when running `pnpm install --frozen-lockfile`
- Use `.textContent` over `.innerText`

## Change management
- When making changes, only make the changes you're asked for. Do not do any Boyscout changes, change wordings etc.
