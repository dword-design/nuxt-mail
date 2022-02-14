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
Adds email sending capabilities to a Nuxt.js app.
<!-- /DESCRIPTION -->

Does not work for static sites (via `nuxt generate`) because emails are sent server-side.

<!-- INSTALL/ -->
## Install

```bash
# npm
$ npm install nuxt-mail

# Yarn
$ yarn add nuxt-mail
```
<!-- /INSTALL -->

## Usage

Add the module to the `modules` array in your `nuxt.config.js`. Note that you need to add it to `modules` instead of `buildModules`.

```js
export default {
  modules: [
    ['nuxt-mail', {
      smtp: {
        host: "smtp.example.com",
        port: 587,
      },
    }],
  ],
  // or use the top-level option:
  mail: {
    smtp: {
      host: "smtp.example.com",
      port: 587,
    },
  },
}
```

The `smtp` options are required and directly passed to [nodemailer](https://nodemailer.com/smtp/). Refer to their documentation for available options. The module injects a `$mail` variable, which is used to send emails like so:

```js
this.$mail.send('config', {
  from: 'John Doe',
  subject: 'Incredible',
  text: 'This is an incredible test message',
  to: 'foo@@bar.de',
})
```

We will see in a minute what the `config` parameter means.

## Sending emails from the client

Sending emails has security implications, which means that server side and client side work a bit differently. On the server side you can basically do anything you can also do with nodemailer, but you also have to be careful. For the client side, you define so-called message configs that are triggered by the client but are actually executed on the server. Think of them like templates that have parameters and you trigger them via the client. This approach is similar to what [EmailJS](https://www.emailjs.com/) does. You can also define multiple message configs, depending on the use cases. To define configs, set the `configs` property in your module config. Then you reference the config via the first parameter of `this.$mail.send`. Here is an example:

```js
export default {
  modules: [
    ['nuxt-mail', {
      configs: {
        contact: ({ replyTo, text }) => ({
          from: 'admin@foo.de',
          to: 'admin@foo.de',
          replyTo,
          text,
        }),
      },
      smtp: { /* ... */ },
    }],
  ],
}
```

Now we can implement our contact form like so:

```js
<template>
  <form @submit.prevent="submit">
    <label for="email">Email</label>
    <input type="email" id="email" name="email" v-model="email" />

    <label for="email">Text</label>
    <textarea id="text" name="text" v-model="text" />

    <button type="submit" name="submit">Send</button>
  </form>
</template>

<script>
export default {
  data: () => ({
    email: '',
    text: '',
  }),
  methods: {
    submit() {
      return this.$mail.send('contact', {
        replyTo: this.email,
        text: this.text,
      })
    },
  },
}
</script>
```

Great, that already works! You can also pass an object to a message config instead of a function, in which case it will add the object properties to the values passed to `this.$mail.send`. The following example does the same as the one above:

```js
export default {
  modules: [
    ['nuxt-mail', {
      configs: {
        contact: {
          from: 'admin1@foo.de',
          to: 'admin1@foo.de',
        },
      },
      smtp: { /* ... */ },
    }],
  ],
}
```

You can also send multiple emails by returning an array (also works for the function):

```js
export default {
  modules: [
    ['nuxt-mail', {
      configs: {
        contact: [
          {
            from: 'admin1@foo.de',
            to: 'admin1@foo.de',
            replyTo,
            text,
          },
          {
            from: 'admin2@foo.de',
            to: 'admin2@foo.de',
            replyTo,
            text,
          },
        ],
      },
      smtp: { /* ... */ },
    }],
  ],
}
```

## Server side

Since Nuxt is a Vue-based framework, a lot of the user interaction is going on client-side. If you do want to run `this.$mail.send` from the server, you can do that too. Server-side execution does not require a message config, you can also send emails directly. Be careful though, do not just expose an interface to the public because it can be used for spamming. There are not too many use cases to run `this.$mail.send` from the server, but here is an example that sends an email to an admin when loading a page via `asyncData`. Here `$mail.send` is accessed from the application context.

```js
<template>
  <div />
</template>

<script>
export default {
  asyncData: ({ $mail, req }) => $mail.send({
    from: 'admin@foo.de',
    replyTo: req.body.email,
    text: req.body.text,
    to: 'admin@foo.de',
  }),
}
</script>
```

Note that you do not have to pass the first config parameter anymore but you can pass the message directly. Still, you can pass it and recycle the config if you want 🛠:

```js
<template>
  <div />
</template>

<script>
export default {
  asyncData: ({ $mail, req }) => $mail.send('contact', {
    from: 'admin@foo.de',
    replyTo: req.body.email,
    text: req.body.text,
    to: 'admin@foo.de',
  }),
}
</script>
```

If you want to handle form submission server-side, you could add [body-parser](https://www.npmjs.com/package/body-parser) to your server middlewares and then access `context.req.body` in `asyncData`.

```js
// nuxt.config.js

import bodyParser from 'body-parser'

export default {
  serverMiddleware: [
    bodyParser.urlencoded({ extended: false }),
  ],
}
```

```js
<template>
  <form method="POST">
    <label for="email">Email</label>
    <input type="email" id="email" name="email" v-model="email" />

    <label for="text">Text</label>
    <textarea id="text" name="text" v-model="text" />
    
    <button type="submit" name="submit">Send</button>
  </form>
</template>

<script>
export default {
  asyncData: ({ $mail, req }) => {
    if (req.body.submit) {
      return $mail.send('contact', {
        from: 'admin@foo.de',
        replyTo: req.body.email,
        text: req.body.text,
        to: 'admin@foo.de',
      })
    }
  }
}
</script>
```

## FAQ

### What about server middlewares?

You cannot access the application context from server middlewares (as far as I know, otherwise let me know). So, if you want to send emails from your custom REST API, you should use `nodemailer` directly.

### Can I access the Nuxt application context in a message config?

You can't, and the reason is that `this.$mail.send` internally calls a serverMiddleware route and those routes cannot access the context. In fact it is not really needed because on client side you can access the context from the calling function via `this`, and on the server side you can access it via the `context` parameter passed to the respective functions. In both cases, run your application logic and then pass the result to `$mail.send`. In case there are issues that are not covered here, feel free to open up an [issue](https://github.com/dword-design/nuxt-mail/issues).

### How to setup Gmail?

You have to setup an [app-specific password](https://myaccount.google.com/apppasswords) to log into the SMTP server. Then, add the following config to your `nuxt-mail` config:

```js
export default {
  modules: [
    ['nuxt-mail', {
      // ...
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

Missing something? Add your service here via a [pull request](https://github.com/dword-design/nuxt-mail/pulls).

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

[MIT License](https://opensource.org/licenses/MIT) © [Sebastian Landwehr](https://sebastianlandwehr.com)
<!-- /LICENSE -->
