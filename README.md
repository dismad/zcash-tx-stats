# zcash-tx-stats

## Install

``` bash
npm install
```

## Setup

Modify `.env` file as needed:
- LWD_URI
  - The lightwalletd server URI, omit the `https://`.
- LOCAL_LWD
  - If using a local lightwalletd server, set `LOCAL_LWD="true"`.
- DUMP_FILE
  - The filename for dumping the transactions data.

## Usage
- Fetching blocks
  > Run `node index.js` and wait for block to be downloaded. When done press `ctrl+c` to break.
- Dumping transactions information
  > Run `node dump_database.js`.

## Ironwood

Compact blocks expose Ironwood on `CompactTx.ironwoodActions` (field 9). The server must be lightwalletd >= 0.5.0, Zaino >= 0.6, or Zebra's lightwalletd gRPC. Older servers omit the field and the count stays 0.

Existing databases need the columns once:

```sql
ALTER TABLE privacysets ADD COLUMN ironwood INTEGER NOT NULL DEFAULT 0;
ALTER TABLE privacysets ADD COLUMN ironwood_filter INTEGER NOT NULL DEFAULT 0;
```

Buckets from NU6.3 (height 3428143) have to be recomputed. `height` is not unique, so a rescan upserts the existing row instead of inserting another one. Start at the bucket boundary before activation:

```bash
RESYNC_FROM=3427200 node index.js
```

Then `node dump_database.js`.

