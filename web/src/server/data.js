import { readFileSync, writeFileSync } from 'fs';

const dataFilename = __dirname + '/../../../data.json';

export const data = JSON.parse(readFileSync(dataFilename));
export const items = Object.keys(data).map(key => Object.assign({ id: key, online: false }, data[key]));
export const itemsMap = new Map();
export const itemsMapByMac = new Map();

items.forEach(item => {
    itemsMap.set(item.id, item);
    itemsMapByMac.set(item.mac, item);
});

export function write() {
    writeFileSync(dataFilename, JSON.stringify(data));
}
