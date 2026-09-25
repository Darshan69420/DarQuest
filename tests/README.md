# Tests

Headless browser tests that play the game. They need [Playwright](https://playwright.dev)
(`npm i -g playwright`) and the game served locally:

```sh
python3 -m http.server 8123        # from the repository root
```

Then, from the repository root:

```sh
# start a new game and check for console errors
node tests/run.cjs --low

# play the story: quests 1 to 8, or 8 quests from quest 25
node tests/run.cjs tests/playthrough.js --low --q="start=0&count=8"
node tests/run.cjs tests/playthrough.js --low --q="start=24&count=8"

# random-action fuzzing (try a few seeds, levels and story points)
node tests/run.cjs tests/fuzz.js --low --q="seed=1&n=300&level=1"
node tests/run.cjs tests/fuzz.js --low --q="seed=7&n=400&level=30&start=20"
node tests/run.cjs tests/fuzz.js --low --w=390 --h=844 --q="seed=13&n=300&level=25&start=24"

# the Sol Mage wallet, with a pretend wallet and network
node tests/wallet.cjs
```

`--low` uses Low graphics quality, which runs much faster in a headless browser. Each run
ends with `no console errors` when all is well; the fuzzer also prints the scenarios it tried.
