# React 19 Migration Checklist

Upgrade path from React 17 to React 19. Do each step in order. Each one should
typecheck and smoke-test cleanly before you start the next.

## Step 1: Nivo 0.99 on React 17 _(in progress)_

- [x] Upgrade all `@nivo/*` packages to 0.99 (`479798ca`)
- [x] Fix the `nivoTheme.ts` type errors: switch to `PartialTheme` and remove the
      `defaultTheme` spreads (`479798ca`)
- [x] Add pnpm overrides forcing all six `@react-spring/*` packages to `^10.1.2`,
      confirmed applied with no links left to 9.7.5
- [ ] Stage `pnpm-workspace.yaml` and `pnpm-lock.yaml`, then commit
- [ ] _(optional)_ `pnpm prune` to delete the unused 9.7.5 folders
- [ ] `pnpm typecheck` with no nivo errors
- [ ] Smoke-test every chart: training plots, confusion matrix, histogram,
      scatter and swarm, including animations

> **Why the overrides:** nivo 0.99 accepts `@react-spring/* ^10`, but pnpm kept
> the locked 9.7.5, whose react peer range stops at `^18`. Override all six
> packages together, because `@nivo/heatmap` depends on `@react-spring/core`
> directly; mixed versions would load two animation loops.
>
> **pnpm gotcha:** pnpm doesn't notice an `overrides` change on its own. If
> `pnpm install` does nothing after you edit `overrides`, delete
> `node_modules/.pnpm-workspace-state-v1.json` and run `pnpm install` again.

## Step 2: React and react-redux together

These have to move as one change, because `react-redux@9` requires React
`^18.0 || ^19` and `@types/react ^18.2.25 || ^19`.

- [ ] _(optional)_ Go to React 18.3 first, so its deprecation warnings show what
      React 19 will break
- [ ] Bump `react`, `react-dom`, `@types/react` and `@types/react-dom` to 19
- [ ] Bump `react-redux` to 9 and remove `@types/react-redux`
- [ ] `src/index.tsx`: replace `render` with `createRoot` from `react-dom/client`
- [ ] `useRef()` with no argument:
  - [ ] `src/components/inputs/ToolButton.tsx:90`
  - [ ] `src/hooks/useDebounce.ts:11`
- [ ] Global `JSX.*` to `React.JSX.*`:
  - [ ] `src/components/app-shell/AlertBar.tsx:51`
  - [ ] `src/views/MeasurementViewer/components/custom-tab-switcher/props.ts:10`
  - [ ] `src/views/MeasurementViewer/components/custom-tab-switcher/CustomTabs.tsx`
        (5 overloads)
- [ ] Check `cloneElement` typing in
      `src/components/inputs/TooltipTextButton.tsx:48,54`
- [ ] `pnpm typecheck` clean
- [ ] Re-run the peer-range check (see below) and confirm no React 19 failures

## Step 3: Runtime smoke test

- [ ] Color pickers (`react-color`, unmaintained): `ColorPicker`, `UISettings`,
      `ChannelHeader`
- [ ] File drop zone (`react-dnd` 15): `DropBox.tsx`
- [ ] All charts again, now on React 19
- [ ] Components that set state after `await` or `.then` (about 10), since
      React 18 now batches those updates
- [ ] `pnpm test` and `pnpm build`

## Cleanup (doesn't block the upgrade)

- [ ] Remove the `@react-spring/*` overrides once nivo requires `^10` itself
- [ ] Unmet peer: `eslint-plugin-react@7.37.5` wants ESLint ≤ 9.7, but you have
      10.10.0
- [ ] Unmet peer: `tsconfck@3.1.5` (through `vite-tsconfig-paths`) wants
      TypeScript `^5`, but you have 6.0.2

## Checking peer ranges

- **Direct and transitive conflicts:** `pnpm peers check`
- **Which version a package resolves to, and who pulls it in:**
  `pnpm why <package>`
- **Unwanted second copies:** check where the `node_modules/.pnpm/<pkg>/node_modules/...`
  symlinks point, not just which folders exist. pnpm can leave unused
  versions behind in the store.
