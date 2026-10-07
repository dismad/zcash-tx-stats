const SAPLING_ACTIVATION = 419200;
const ORCHARD_ACTIVATION = 1687104;
const IRONWOOD_ACTIVATION = 3428143;
const SPAM_FILTER_LIMIT = 50;
const SYNC_PERIOD = 1152;

function emptyBucket() {
    return {
        sapling: 0,
        sapling_filter: 0,
        orchard: 0,
        orchard_filter: 0,
        ironwood: 0,
        ironwood_filter: 0,
        transactions: 0,
        transactions_filter: 0,
    };
}

function accumulateTx(bucket, blockHeight, vtx) {
    const actions = vtx.actions || [];
    const outputs = vtx.outputs || [];
    const spends = vtx.spends || [];
    const ironwoodActions = vtx.ironwoodActions || [];

    const isSpam =
        actions.length > SPAM_FILTER_LIMIT ||
        outputs.length > SPAM_FILTER_LIMIT ||
        ironwoodActions.length > SPAM_FILTER_LIMIT;

    let shielded = false;

    if (blockHeight >= ORCHARD_ACTIVATION && actions.length > 0) {
        bucket.orchard += 1;
        if (!isSpam) bucket.orchard_filter += 1;
        shielded = true;
    }

    if (outputs.length > 0 || spends.length > 0) {
        bucket.sapling += 1;
        if (!isSpam) bucket.sapling_filter += 1;
        shielded = true;
    }

    if (blockHeight >= IRONWOOD_ACTIVATION && ironwoodActions.length > 0) {
        bucket.ironwood += 1;
        if (!isSpam) bucket.ironwood_filter += 1;
        shielded = true;
    }

    if (shielded) {
        bucket.transactions += 1;
        if (!isSpam) bucket.transactions_filter += 1;
    }

    return bucket;
}

function toSummary(row) {
    return {
        height: row.height,
        sapling: row.sapling,
        sapling_filter: row.sapling_filter,
        orchard: row.orchard,
        orchard_filter: row.orchard_filter,
        ironwood: row.ironwood,
        ironwood_filter: row.ironwood_filter,
        transactions: row.transactions,
        transactions_filter: row.transactions_filter,
    };
}

module.exports = {
    SAPLING_ACTIVATION,
    ORCHARD_ACTIVATION,
    IRONWOOD_ACTIVATION,
    SPAM_FILTER_LIMIT,
    SYNC_PERIOD,
    emptyBucket,
    accumulateTx,
    toSummary,
};
