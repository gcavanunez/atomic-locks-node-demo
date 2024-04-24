import consola from 'consola';
import { cache } from './cache';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
consola.log('this user ->', process.pid);
let attemp = 0;

async function main() {
    attemp++;
    consola.box(`User ${process.pid} trying to buy round ${attemp}...`);

    const lock = await cache.lock('purchase', 60000);

    const acquired = await lock.get();

    if (!acquired) {
        consola.error('Nurp');
        return;
    }

    consola.start('Purchasing...');
    await sleep(30000);
    consola.success('Purchased!');

    await lock.release();
    attemp = 0;
}

// main()

async function wrapped() {
    while (true) {
        await main();
        await sleep(1000);
    }
}

wrapped();
