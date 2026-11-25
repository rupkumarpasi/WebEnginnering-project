# Design tokens

The theme is applied with `data-theme` on the document root. ThemeContext persists an explicit choice; on first use, the operating-system color preference selects the initial theme.

| Token | Light value | Dark value | Usage |
| --- | --- | --- | --- |
| `--bg` | `#f8fafc` | `#0b1220` | App page background |
| `--surface` | `#ffffff` | `#131c2e` | Navigation, cards, and form controls |
| `--text` | `#0f172a` | `#e2e8f0` | Primary text |
| `--muted` | `#64748b` | `#94a3b8` | Supporting text and labels |
| `--primary` | `#0ea5e9` | `#38bdf8` | Links, highlights, and primary actions |
| `--primary-contrast` | `#ffffff` | `#06202e` | Text on primary actions |
| `--border` | `#e2e8f0` | `#243049` | Card, input, and divider borders |
| `--radius` | `0.75rem` | `0.75rem` | Shared component corner radius |
| `--danger` | `#b91c1c` | `#fca5a5` | Error and validation messages |

The `@theme inline` block maps these values to Tailwind utilities such as `bg-bg`, `bg-surface`, `text-fg`, `text-muted`, `text-primary`, `border-line`, `rounded-card`, and `font-sans`. The `Button` and `Card` primitives compose those utilities to keep repeated styles consistent.
