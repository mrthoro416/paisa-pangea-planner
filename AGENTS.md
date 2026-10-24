<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Render map-label flags from the bundled `flag-icons` package rather than emoji so country markers remain consistent across platforms.
- Use the SVG orthographic globe on Apple/WebKit browsers because MapLibre globe rendering can lose country layers there.
- The saved passport preference (`src/lib/passport-pref.tsx`, localStorage `paisa-passport`) is display-only personalization: all visa data stays Colombian-passport-only (`PASSPORT` in `src/data/countries.ts`), so never feed the preference into entry rules, filters, or the map.
