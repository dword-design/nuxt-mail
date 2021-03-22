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
      <img src="https://gitpod.io/button/open-in-gitpod.svg" alt="Open in Gitpod">
    </a><a href="https://www.buymeacoffee.com/dword">
      <img
        src="https://www.buymeacoffee.com/assets/img/guidelines/download-assets-sm-2.svg"
        alt="Buy Me a Coffee"
        height="32"
      >
    </a><a href="https://paypal.me/SebastianLandwehr">
      <img
        src="https://dword-design.de/images/paypal.svg"
        alt="PayPal"
        height="32"
      >
    </a><a href="https://www.patreon.com/dworddesign">
      <img
        src="https://dword-design.de/images/patreon.svg"
        alt="Patreon"
        height="32"
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
$ npm install nuxt-mail

# Yarn
$ yarn add nuxt-mail
```
<!-- /INSTALL -->

## Usage

Add the module to your `nuxt.config.js`. We also have to install the [@nuxtjs/axios](https://www.npmjs.com/package/@nuxtjs/axios) module because it is used internally to call the server route:
```js
export default {
  modules: [
    '@nuxtjs/axios',
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

The `smtp` options are required and directly passed to [nodemailer](https://nodemailer.com/smtp/). Refer to their documentation for available options. Also note that the module only works for `universal` mode and not for `nuxt generate`, because we need the server route (see the [Nuxt.js documentation](https://nuxtjs.org/docs/2.x/configuration-glossary/configuration-mode) for details about the mode).

The module injects the `$mail` variable, which we now use to send emails:
```js
// Inside a component
this.$mail.send({
  from: 'John Doe',
  subject: 'Incredible',
  text: 'This is an incredible test message',
  to: 'johndoe@gmail.com',
})
```

You can also directly call the generated `/mail/send` post route:
```js
// Inside a component
this.$axios.$post('/mail/send', {
  from: 'John Doe',
  subject: 'Incredible',
  text: 'This is an incredible test message',
  to: 'johndoe@gmail.com',
})
```

Note that the data are passed to [nodemailer](https://nodemailer.com/message/). Refer to the documentation for available config options.

<!-- LICENSE/ -->
## Contribute

Are you missing something or want to contribute? Feel free to file an [issue](https://github.com/dword-design/nuxt-mail/issues) or [pull request](https://github.com/dword-design/nuxt-mail/pulls)! ⚙️

## Support

Hey, I am Sebastian Landwehr, a freelance web developer, and I love developing web apps and open source packages. If you want to support me so that I can keep packages up to date and build more helpful tools, you can donate here:

<p>
  <a href="https://www.buymeacoffee.com/dword">
    <img
      src="https://www.buymeacoffee.com/assets/img/guidelines/download-assets-sm-2.svg"
      alt="Buy Me a Coffee"
      height="32"
    >
  </a>&nbsp;If you want to send me a one time donation. The coffee is pretty good 😊.<br/>
  <a href="https://paypal.me/SebastianLandwehr">
    <img
      src="https://dword-design.de/images/paypal.svg"
      alt="PayPal"
      height="32"
    >
  </a>&nbsp;Also for one time donations if you like PayPal.<br/>
  <a href="https://www.patreon.com/dworddesign">
    <img
      src="https://dword-design.de/images/patreon.svg"
      alt="Patreon"
      height="32"
    >
  </a>&nbsp;Here you can support me regularly, which is great so I can steadily work on projects.
</p>

Thanks a lot for your support! ❤️

## License

[MIT License](https://opensource.org/licenses/MIT) © [Sebastian Landwehr](https://dword-design.de)
<!-- /LICENSE -->
