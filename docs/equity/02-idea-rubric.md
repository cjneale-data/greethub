# Idea rubric

This is GreetHub's own addition to the Slicing Pie method; base Slicing Pie gives ideas little value. The owner can change every number below (they live in `EquityConfig` in `app/lib/equity/index.ts`).

An idea earns nothing until its status is `adopted` or `shipped` and a partner other than the author has scored it. A score is documented with a short written reason.

| Criterion | Weight | 0 | 1 to 2 | 3 to 4 | 5 |
|---|---|---|---|---|---|
| Impact | 0.5 | no measurable effect | small convenience or one-off | clear gain in sales, cost, safety or customer happiness | changes the business materially, with numbers |
| Originality | 0.2 | copied | common practice reused | adapted in a new way | genuinely new to the team and not found in competitors |
| Evidence it was used | 0.3 | not used | trialled once | in regular use | in production for 30+ days with measured result |

Weighted score = sum(weight x score) / sum(weights). Award = cap per idea x score / 5. Defaults: cap 5,000 slices per idea, 20,000 per person, minimum score 2.

Rules:
1. The author cannot score their own idea.
2. Scores and reasons are stored with the idea and are never silently edited; re-scoring is a new dated note.
3. An idea shipped by someone else still credits the author only for the idea; the build time is the builder's time entry.
4. Ideas from AI agents earn nothing. A human who adopts and develops an AI-suggested idea earns for their own review and build time.
5. Owner decision needed: whether the per-idea and per-person caps should be a fixed number or a percentage of total slices.
