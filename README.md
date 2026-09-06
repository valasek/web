[![Netlify Status](https://api.netlify.com/api/v1/badges/690590fb-b596-413b-8916-a249de10db01/deploy-status)](https://app.netlify.com/sites/stanislavvalasek/deploys)

# www.stanislavvalasek.com

Personal website of [Stanislav Valasek](www.stanislavvalasek.com).

## Standing on the shoulded of giants

Static page generator [Hugo](https://gohugo.io/) using [**HugoBlox**](https://hugoblox.com/) - resume theme, hosted on [Netlify](https://www.netlify.com/).

## License

Copyright 2020-present [Stanislav Valasek](www.stanislavvalasek.com)

## Usefull commands

```
hugo mod clean
hugo mod get -u ./...
hugo server
hugo server --disableFastRender
```

Custom css styles are stored in /assets/css

[HugoBlox Documentation](https://docs.ownable.dev/hugoblox/)
[New Blox docs](https://github.com/HugoBlox/kit/tree/main/modules/blox/blox)

[HugoBlox template source code](https://github.com/HugoBlox/kit/tree/main/templates/resume)

## ToDo

Doplnit testimoials podla awards / https://github.com/HugoBlox/hugo-blox-builder/blob/4f621dfa3a5ab798bea17ad2760bd61815c76f25/modules/blox-tailwind/layouts/partials/blox/resume-awards.html#L37

# Update

## Hugo

The Hugo version is pinned in three places - keep them in sync, then rebuild:

- `.devcontainer/devcontainer.json` (`features` -> hugo -> `version`)
- `netlify.toml` (`HUGO_VERSION`)
- `hugoblox.yaml` (`build.hugo_version`) - also read by the CI workflow

```
hugo mod get -u
hugo mod tidy
pnpm update
pnpm run build
```

> This project uses **pnpm**. Do not run `npm install` - it would create a competing `package-lock.json`.