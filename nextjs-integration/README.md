# Next.js integration

These are the same demo and brain as `index.html`, but as a Next.js App Router
page and API route (the version running in the DG Academy website on the
`claude/atlas-toy-design-gpocmk` branch of Issarakhin/thedgacademy):

- `atlas-page.tsx` → copy to `src/app/atlas/page.tsx`
- `atlas-api-route.ts` → copy to `src/app/api/atlas/route.ts`

The API route uses the cloud LLM when `OPENROUTER_API_KEY` is set in
`.env.local`, and falls back to the bilingual offline brain otherwise.
Requires `@openrouter/sdk`, `lucide-react`, and the shadcn/ui Button and
Input components.
