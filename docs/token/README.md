# Creating the Sol Mage token

The game reads one number from Solana: how many Sol Mage (SOLMAGE) tokens a connected wallet
holds. This guide creates the token with your own wallet. Do it on **devnet** first: devnet SOL
is free, and nothing there has real value.

You run these commands on your own computer. Never paste a private key or seed phrase into a
chat, a website or this repository.

## 1. Install the tools

```sh
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"   # the Solana command line
cargo install spl-token-cli                                       # skip if `spl-token --version` works
```

## 2. Make a devnet wallet and get free SOL

```sh
solana config set --url devnet
solana-keygen new --outfile ~/.config/solana/solmage-authority.json
solana config set --keypair ~/.config/solana/solmage-authority.json
solana airdrop 2          # if it is rate-limited, use https://faucet.solana.com
```

The file `solmage-authority.json` controls the token. Back it up somewhere safe and keep it
private.

## 3. Create the token with its name and logo

```sh
spl-token create-token --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb --enable-metadata --decimals 6
```

It prints `Address: <MINT>`. That address is the token. Then attach the name, symbol and logo
(the metadata file in this folder is served by GitHub Pages once Pages is on):

```sh
spl-token initialize-metadata <MINT> "Sol Mage" "SOLMAGE" https://darshan69420.github.io/DarQuest/docs/token/solmage.json
spl-token create-account <MINT>
spl-token mint <MINT> 1000000000        # one billion tokens to your authority wallet
```

## 4. Try it in the game

1. In Phantom: Settings → Developer Settings → turn on Testnet Mode, and pick Solana Devnet.
2. Send yourself some tokens:
   ```sh
   spl-token transfer <MINT> 20000 <YOUR_PHANTOM_ADDRESS> --fund-recipient --allow-unfunded-recipient
   ```
3. Open the game with `?solmint=<MINT>` on the end of the address, for example
   `http://localhost:8000/?solmint=<MINT>`, and open **Menu → Sol Mage wallet**. Connect
   Phantom and you should see 20,000 SOLMAGE and the Sunbound Adept perks.
4. When it works, put the mint address in `src/chain.js` (`mint: '...'`) so everyone gets it
   without the link.

Perk tiers live in `TIERS` in `src/chain.js`: 1+ tokens for Sol Mage, 10,000+ for Sunbound
Adept and 1,000,000+ for Solar Archon. Change the numbers to suit your supply.

## 5. Mainnet, when you are ready

Repeat steps 2 and 3 with `solana config set --url mainnet-beta` and real SOL (creating the
token and its metadata costs a few cents of rent). Then in `src/chain.js`:

- set `network: 'mainnet'` and `mint` to the new address;
- replace the public mainnet RPC URL with your own from a provider such as Helius or
  QuickNode, because the public one limits how often browsers can ask.

To fix the supply for good, so nobody (including you) can mint more:

```sh
spl-token authorize <MINT> mint --disable
```

Before you sell the token or promote it as something to buy, check the rules where you live.
In some countries, including the United States, selling a token that people buy hoping it
gains value can count as a securities offering.
