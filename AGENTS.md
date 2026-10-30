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
- Resolve visa displays through the normalized passport/destination rule layer; keep country geography, climate and activities independent so passport changes update rules without remounting the map or resetting travel state.
- The visa-free filter includes visa_free and freedom_of_movement to match the green map family; keep exact source categories in details and the dedicated free-movement filter, and do not merge other same-color categories with different requirements.
- Import workbook rows offline into source-controlled JSON with provenance; missing pairs return unknown, and imported source dates are not official verification dates.
- Canonical global imports use lossless column arrays and deduplicated citations, with a separately chunked source register, to keep repository files and browser data compact; retain earlier Colombian discrepancies independently until reviewed.
