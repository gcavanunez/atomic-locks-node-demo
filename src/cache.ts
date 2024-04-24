import { Storage, StorageValue, createStorage } from 'unstorage';
import fsDriver from 'unstorage/drivers/fs';

function addTime(milliseconds: number) {
    const currentDate = new Date();
    currentDate.setMilliseconds(currentDate.getMilliseconds() + milliseconds);
    return currentDate.getTime();
}

class Cache {
    storage: Storage<StorageValue>;
    key: string = '';

    constructor() {
        this.storage = createStorage({
            driver: fsDriver({ base: './tmp', noClear: true }),
        });
    }

    async lock(key: string, seconds: number) {
        const exists = await this.storage.getMeta(key);
        this.key = key;

        if (!exists.mtime) {
            await this.set(seconds);
        }

        const value = await this.get();
        if (value) {
            await this.set(seconds);
        }

        return this;
    }

    async set(seconds: number) {
        await this.storage.setItem(this.key, {
            expiration: addTime(seconds),
            owner: process.pid,
        });
    }

    async get(): Promise<boolean> {
        const value = await this.storage.getItem<{
            expiration: number;
            owner: number;
        }>(this.key);

        if (!value) {
            throw new Error('No value found');
        }

        if (process.pid !== value.owner) {
            return false;
        }

        const now = new Date().getTime();
        return +value.expiration >= now && process.pid === value.owner;
    }

    async release() {
        await this.storage.removeItem(this.key);
    }
}

export const cache = new Cache();
