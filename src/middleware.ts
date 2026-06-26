import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  const url = new URL(context.request.url);

  if (url.hostname === 'www.skyphusion.net') {
    url.hostname = 'skyphusion.net';
    return Response.redirect(url.toString(), 301);
  }

  if (url.pathname === '/blog/cf-email-relay' || url.pathname === '/blog/cf-email-relay/') {
    return Response.redirect(new URL('/blog/postern/', url).toString(), 301);
  }

  return next();
});
