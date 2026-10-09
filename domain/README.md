# design.ahaslides.io proxy

A minimal Cloudflare Worker (`ahaslides-design-docs`) that serves the GitHub Pages site
(`https://ahaslides-product.github.io/ahaslides-design`) at `https://design.ahaslides.io`.
GET/HEAD only; Pages redirects are rewritten to the new host; responses are edge-cached for 10 minutes.
The Worker Custom Domain makes Cloudflare create the DNS record and certificate itself.

Do not set a GitHub Pages custom domain: github.io would then redirect to design.ahaslides.io and loop with this proxy.

## Redeploy

```
cd domain
CLOUDFLARE_API_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=<account id> npx wrangler deploy
```

This token cannot write zone routes, so wrangler uploads the script and then reports a 403 on the route step. The custom domain is already attached and that 403 is harmless; to attach it afresh, `PUT /accounts/<account id>/workers/domains` with `{"hostname":"design.ahaslides.io","service":"ahaslides-design-docs","environment":"production","zone_name":"ahaslides.io"}`.

The token is `CLOUDFLARE_WORKERS_API_TOKEN` in the fleet SSM param `ahaslides-slide-types-market-place/env`.

## Revert

Delete the Worker (or its custom domain) in the Cloudflare dashboard, then revert the PR.
