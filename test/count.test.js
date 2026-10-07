const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
    ORCHARD_ACTIVATION,
    IRONWOOD_ACTIVATION,
    SPAM_FILTER_LIMIT,
    emptyBucket,
    accumulateTx,
    toSummary,
} = require('../lib/count');

function tx(partial) {
    return {
        actions: [],
        outputs: [],
        spends: [],
        ironwoodActions: [],
        ...partial,
    };
}

test('sapling spend or output counts as one shielded tx', () => {
    const bucket = emptyBucket();
    accumulateTx(bucket, ORCHARD_ACTIVATION - 1, tx({ spends: [{}] }));
    accumulateTx(bucket, ORCHARD_ACTIVATION - 1, tx({ outputs: [{}] }));
    assert.deepEqual(bucket, {
        sapling: 2,
        sapling_filter: 2,
        orchard: 0,
        orchard_filter: 0,
        ironwood: 0,
        ironwood_filter: 0,
        transactions: 2,
        transactions_filter: 2,
    });
});

test('orchard actions are ignored before activation and counted after', () => {
    const bucket = emptyBucket();
    accumulateTx(bucket, ORCHARD_ACTIVATION - 1, tx({ actions: [{}] }));
    accumulateTx(bucket, ORCHARD_ACTIVATION, tx({ actions: [{}] }));
    assert.equal(bucket.orchard, 1);
    assert.equal(bucket.orchard_filter, 1);
    assert.equal(bucket.transactions, 1);
});

test('a tx in two pools counts once, matching the old ceil(0.5+0.5) total', () => {
    const bucket = emptyBucket();
    accumulateTx(bucket, ORCHARD_ACTIVATION, tx({ actions: [{}], outputs: [{}] }));
    assert.equal(bucket.sapling, 1);
    assert.equal(bucket.orchard, 1);
    assert.equal(bucket.transactions, 1);
    assert.equal(bucket.transactions_filter, 1);
});

test('ironwoodActions are ignored before NU6.3 and counted after', () => {
    const bucket = emptyBucket();
    accumulateTx(bucket, IRONWOOD_ACTIVATION - 1, tx({ ironwoodActions: [{}] }));
    accumulateTx(bucket, IRONWOOD_ACTIVATION, tx({ ironwoodActions: [{}, {}] }));
    assert.equal(bucket.ironwood, 1);
    assert.equal(bucket.ironwood_filter, 1);
    assert.equal(bucket.transactions, 1);
});

test('missing ironwoodActions is treated as an empty list', () => {
    const bucket = emptyBucket();
    accumulateTx(bucket, IRONWOOD_ACTIVATION, { actions: [], outputs: [], spends: [] });
    assert.equal(bucket.ironwood, 0);
    assert.equal(bucket.transactions, 0);
});

test('a tx touching all three pools still counts as one transaction', () => {
    const bucket = emptyBucket();
    accumulateTx(
        bucket,
        IRONWOOD_ACTIVATION,
        tx({ spends: [{}], actions: [{}], ironwoodActions: [{}] }),
    );
    assert.equal(bucket.sapling, 1);
    assert.equal(bucket.orchard, 1);
    assert.equal(bucket.ironwood, 1);
    assert.equal(bucket.transactions, 1);
});

test('spam is excluded from filter counts but kept in the raw counts', () => {
    const bucket = emptyBucket();
    const spamActions = Array.from({ length: SPAM_FILTER_LIMIT + 1 }, () => ({}));
    accumulateTx(bucket, IRONWOOD_ACTIVATION, tx({ ironwoodActions: spamActions }));
    accumulateTx(bucket, IRONWOOD_ACTIVATION, tx({ actions: spamActions, outputs: [{}] }));
    assert.equal(bucket.ironwood, 1);
    assert.equal(bucket.ironwood_filter, 0);
    assert.equal(bucket.orchard, 1);
    assert.equal(bucket.orchard_filter, 0);
    assert.equal(bucket.sapling, 1);
    assert.equal(bucket.sapling_filter, 0);
    assert.equal(bucket.transactions, 2);
    assert.equal(bucket.transactions_filter, 0);
});

test('summary row keeps ironwood next to the existing pool fields', () => {
    const row = toSummary({
        height: 3508992,
        sapling: 190,
        sapling_filter: 190,
        orchard: 91,
        orchard_filter: 91,
        ironwood: 2547,
        ironwood_filter: 2500,
        transactions: 2700,
        transactions_filter: 2650,
        createdAt: 'ignore',
    });
    assert.equal(row.ironwood, 2547);
    assert.equal(row.ironwood_filter, 2500);
    assert.equal(row.createdAt, undefined);
});
