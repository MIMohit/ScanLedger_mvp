import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

export const setCache = (key, value) => {
  return cache.set(key, value);
};

export const getCache = (key) => {
  return cache.get(key);
};

export const delCache = (key) => {
  return cache.del(key);
};

export default cache;
