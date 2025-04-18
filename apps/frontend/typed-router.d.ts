/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck
// Generated by unplugin-vue-router. ‼️ DO NOT MODIFY THIS FILE ‼️
// It's recommended to commit this file.
// Make sure to add this file to your tsconfig.json file as an "includes" or "files" entry.

declare module 'vue-router/auto-routes' {
  import type {
    RouteRecordInfo,
    ParamValue,
    ParamValueOneOrMore,
    ParamValueZeroOrMore,
    ParamValueZeroOrOne,
  } from 'vue-router'

  /**
   * Route name map generated by unplugin-vue-router
   */
  export interface RouteNamedMap {
    '/': RouteRecordInfo<'/', '/', Record<never, never>, Record<never, never>>,
    '/[...all]': RouteRecordInfo<'/[...all]', '/:all(.*)', { all: ParamValue<true> }, { all: ParamValue<false> }>,
    '/chat/[id]': RouteRecordInfo<'/chat/[id]', '/chat/:id', { id: ParamValue<true> }, { id: ParamValue<false> }>,
    '/commands/embed': RouteRecordInfo<'/commands/embed', '/commands/embed', Record<never, never>, Record<never, never>>,
    '/commands/export': RouteRecordInfo<'/commands/export', '/commands/export', Record<never, never>, Record<never, never>>,
    '/commands/sync': RouteRecordInfo<'/commands/sync', '/commands/sync', Record<never, never>, Record<never, never>>,
    '/login': RouteRecordInfo<'/login', '/login', Record<never, never>, Record<never, never>>,
    '/search': RouteRecordInfo<'/search', '/search', Record<never, never>, Record<never, never>>,
    '/settings': RouteRecordInfo<'/settings', '/settings', Record<never, never>, Record<never, never>>,
    '/v2login': RouteRecordInfo<'/v2login', '/v2login', Record<never, never>, Record<never, never>>,
  }
}
