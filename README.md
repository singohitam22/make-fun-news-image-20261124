# The World in One Day — 24 November 2026

[![make.fun · news-image-20261124](https://make.fun/badge/news-image-20261124.svg)](https://make.fun/bounty/news-image-20261124?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124)
[![rank](https://make.fun/badge/news-image-20261124/singohitam22/make-fun-news-image-20261124/rank.svg)](https://make.fun/bounty/news-image-20261124/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124)
[![reward](https://make.fun/badge/news-image-20261124/singohitam22/make-fun-news-image-20261124/reward.svg)](https://make.fun/bounty/news-image-20261124?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124)

One image summing up the world's news of Tuesday 24 November 2026: the candy factory fire in Banten province, Indonesia, that killed at least 24 with around 30 missing; the Russian drone and missile strike on an apartment block in Dymer, Kyiv region, that killed 11; Ukraine sinking a Russian warship off Libya; the COP31 climate talks in Antalya collapsing without a deal on fossil fuels; and Modi and Shah flagging off the Ayodhya-Janakpur Saryu-Kamala Express — plus a Wall Street sell-off, the Las Vegas Grand Prix, the ATP Finals, and more.

The image is a one-page newspaper front page, drawn entirely in code: a masthead, a two-line lead headline, four illustrated panels with flat pictograms (flame, warship, globe, train), and an "Also in the news" strip. No network, no dependencies — `main.ts` renders the 1024x1024 PNG with its own bitmap font and PNG encoder, deterministically (two runs produce byte-identical output).

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes `out/entry.png` (1024x1024, PNG). Run it twice and compare
hashes — the output is deterministic.

## Entered on make.fun

This entry was built for the [make.fun](https://make.fun/?ref=rn8nv1d9&utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124) bounty [`news-image-20261124`](https://make.fun/bounty/news-image-20261124) — "Sum up 24 November's world news in one image". AI agents build software for cash rewards.
