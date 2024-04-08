<!-- TITLE/ -->
# nuxt-mail
<!-- /TITLE -->

<!-- BADGES/ -->
  <p>
    <a href="https://npmjs.org/package/nuxt-mail">
      <img
        src="https://img.shields.io/npm/v/nuxt-mail.svg"
        alt="npm version"
      >
    </a><img src="https://img.shields.io/badge/os-linux%20%7C%C2%A0macos%20%7C%C2%A0windows-blue" alt="Linux macOS Windows compatible"><a href="https://github.com/dword-design/nuxt-mail/actions">
      <img
        src="https://github.com/dword-design/nuxt-mail/workflows/build/badge.svg"
        alt="Build status"
      >
    </a><a href="https://codecov.io/gh/dword-design/nuxt-mail">
      <img
        src="https://codecov.io/gh/dword-design/nuxt-mail/branch/master/graph/badge.svg"
        alt="Coverage status"
      >
    </a><a href="https://david-dm.org/dword-design/nuxt-mail">
      <img src="https://img.shields.io/david/dword-design/nuxt-mail" alt="Dependency status">
    </a><img src="https://img.shields.io/badge/renovate-enabled-brightgreen" alt="Renovate enabled"><br/><a href="https://gitpod.io/#https://github.com/dword-design/nuxt-mail">
      <img
        src="https://gitpod.io/button/open-in-gitpod.svg"
        alt="Open in Gitpod"
        width="114"
      >
    </a><a href="https://www.buymeacoffee.com/dword">
      <img
        src="https://www.buymeacoffee.com/assets/img/guidelines/download-assets-sm-2.svg"
        alt="Buy Me a Coffee"
        width="114"
      >
    </a><a href="https://paypal.me/SebastianLandwehr">
      <img
        src="https://sebastianlandwehr.com/images/paypal.svg"
        alt="PayPal"
        width="163"
      >
    </a><a href="https://www.patreon.com/dworddesign">
      <img
        src="https://sebastianlandwehr.com/images/patreon.svg"
        alt="Patreon"
        width="163"
      >
    </a>
</p>
<!-- /BADGES -->

<!-- DESCRIPTION/ -->
Adds email sending capability to a Nuxt.js app. Adds a server route, an injected variable, and uses nodemailer to send emails.
<!-- /DESCRIPTION -->

Does not work for static sites (via `nuxt generate`) because the module creates a server route.

<!-- INSTALL/ -->
## Install

```bash
# npm
$ npx nuxi module add nuxt-mail

# Yarn
$ yarn nuxi module add nuxt-mail
```
<!-- /INSTALL -->

## Configuration

Add the module to the `modules` array in your `nuxt.config.js`. Note to add it to `modules` instead of `buildModules`, otherwise the server route will not be generated.

```js
// nuxt.config.js
export default {
  modules: [
    ['nuxt-mail', {
      message: {
        to: 'foo@bar.de',
      },
      smtp: {
        host: "smtp.example.com",
        port: 587,
      },
    }],
  ],
  // or use the top-level option:
  mail: {
    message: {
      to: 'foo@bar.de',
    },
    smtp: {
      host: "smtp.example.com",
      port: 587,
    },
  },
}
```

The `smtp` options are required and directly passed to [nodemailer](https://nodemailer.com/smtp/). Refer to their documentation for available options. Also, you have to pass at least `to`, `cc` or `bcc` via the `message` config. This has security reasons, this way the client cannot send emails from your SMTP server to arbitrary recipients. You can actually preconfigure the message via the `message` config, so if you always want to send emails with the same subject or from address, you can configure them here.

The module injects the `$mail` variable, which we now use to send emails:

## Nuxt 3

### Via composable

```html
<script setup>
const mail = useMail()

mail.send({
  from: 'John Doe',
  subject: 'Incredible',
  text: 'This is an incredible test message',
})
</script>
```

### Via injected variable

```html
<script setup>
const { $mail } = useNuxtApp()

$mail.send({
  from: 'John Doe',
  subject: 'Incredible',
  text: 'This is an incredible test message',
})
</script>
```

### Via Options API

```html
<script>
export default {
  methods: {
    sendEmail() {
      this.$mail.send({
        from: 'John Doe',
        subject: 'Incredible',
        text: 'This is an incredible test message',
      })
    },
  },
}
</script>
```

## Nuxt 2

For Nuxt 2, you need to install [@nuxtjs/axios](https://www.npmjs.com/package/@nuxtjs/axios) and add it to your module list before `nuxt-mail`:

```js
// nuxt.config.js
export default {
  modules: [
    [
      '@nuxtjs/axios',
      ['nuxt-mail', { /* ... */ }],
    }],
  ],
}
```

Then you can use the injected variable like so:

```html
<script>
export default {
  methods: {
    sendEmail() {
      this.$mail.send({
        from: 'John Doe',
        subject: 'Incredible',
        text: 'This is an incredible test message',
      })
    },
  },
}
</script>
```

### Note about production use

When you use `nuxt-mail` in production and you configured a reverse proxy that hides your localhost behind a domain, you need to tell `@nuxt/axios` which base URL you are using. Otherwise `nuxt-mail` won't find the send route. Refer to [@nuxt/axios options](https://axios.nuxtjs.org/options) on how to do that. The easiest option is to set the `API_URL` environment variable, or set something else in your `nuxt.config.js`:

```js
// nuxt.config.js
export default {
  axios: {
    baseURL: process.env.BASE_URL,
  },
}
```

## Multiple message configs

It is also possible to provide multiple message configurations by changing the `message` config into an array.

```js
// nuxt.config.js
export default {
  modules: [
    ['nuxt-mail', {
      message: [
        { name: 'contact', to: 'contact@foo.de' },
        { name: 'support', to: 'support@foo.de' },
      ],
      ...
    }],
  ],
}
```

Then you can reference the config like this:

```js
mail.send({
  config: 'support',
  from: 'John Doe',
  subject: 'Incredible',
  text: 'This is an incredible test message',
})
```

Or via index (in which case you do not need the `name` property):

```js
mail.send({
  config: 1, // Resolves to 'support'
  from: 'John Doe',
  subject: 'Incredible',
  text: 'This is an incredible test message',
})
```

Also, the module does not work for static sites (via `nuxt generate`) because the module creates a server route.

## Setting up popular email services

### Gmail

You have to setup an [app-specific password](https://myaccount.google.com/apppasswords) to log into the SMTP server. Then, add the following config to your `nuxt-mail` config. Looks like there are multiple ways to configure Gmail, so it's best to try out the options:

```js
// nuxt.config.js
export default {
  modules: [
    ['nuxt-mail', {
      smtp: {
        service: 'gmail',
        auth: {
          user: 'foo@gmail.com',
          pass: '<app-specific password>',
        },
      },
    }],
  ],
}
```

```js
// nuxt.config.js
export default {
  modules: [
    ['nuxt-mail', {
      smtp: {
        host: "smtp.gmail.com",
        port: 587,
        auth: {
          user: 'foo@gmail.com',
          pass: '<app-specific password>',
        },
      },
    }],
  ],
}
```

Missing something? Add your service here via a [pull request](https://github.com/dword-design/nuxt-mail/pulls).

## Debugging mail errors

If the mail doesn't get sent, you can debug the error using the browser developer tools. If a `500` error is thrown (check out the console output), you can find the error message in the Network tab. For Chrome users, open the Network tab, then find the "send" request. Open it and select the "Response" tab. There it should show the error message. In most cases, it is related to authentication with the SMTP server.

## Open questions

### "Self signed certificate in certificate chain" error

There is [an issue](https://github.com/dword-design/nuxt-mail/issues/62) where the above error is thrown. If someone knows a solution for this, it is warmly welcome 😍.

<!-- LICENSE/ -->
## Contribute

Are you missing something or want to contribute? Feel free to file an [issue](https://github.com/dword-design/nuxt-mail/issues) or a [pull request](https://github.com/dword-design/nuxt-mail/pulls)! ⚙️

## Support

Hey, I am Sebastian Landwehr, a freelance web developer, and I love developing web apps and open source packages. If you want to support me so that I can keep packages up to date and build more helpful tools, you can donate here:

<p>
  <a href="https://www.buymeacoffee.com/dword">
    <img
      src="https://www.buymeacoffee.com/assets/img/guidelines/download-assets-sm-2.svg"
      alt="Buy Me a Coffee"
      width="114"
    >
  </a>&nbsp;If you want to send me a one time donation. The coffee is pretty good 😊.<br/>
  <a href="https://paypal.me/SebastianLandwehr">
    <img
      src="https://sebastianlandwehr.com/images/paypal.svg"
      alt="PayPal"
      width="163"
    >
  </a>&nbsp;Also for one time donations if you like PayPal.<br/>
  <a href="https://www.patreon.com/dworddesign">
    <img
      src="https://sebastianlandwehr.com/images/patreon.svg"
      alt="Patreon"
      width="163"
    >
  </a>&nbsp;Here you can support me regularly, which is great so I can steadily work on projects.
</p>

Thanks a lot for your support! ❤️

## See also

* [nuxt-route-meta](https://github.com/dword-design/nuxt-route-meta): Adds Nuxt page data to route meta at build time.
* [nuxt-modernizr](https://github.com/dword-design/nuxt-modernizr): Adds a Modernizr build to your Nuxt.js app.
* [nuxt-mermaid-string](https://github.com/dword-design/nuxt-mermaid-string): Embed a Mermaid diagram in a Nuxt.js app by providing its diagram string.
* [nuxt-content-git](https://github.com/dword-design/nuxt-content-git): Additional module for @nuxt/content that replaces or adds createdAt and updatedAt dates based on the git history.
* [nuxt-babel-runtime](https://github.com/dword-design/nuxt-babel-runtime): Nuxt CLI that supports babel. Inspired by @nuxt/typescript-runtime.

## License

[MIT License](https://opensource.org/license/mit/) © [Sebastian Landwehr](https://sebastianlandwehr.com)
<!-- /LICENSE -->
