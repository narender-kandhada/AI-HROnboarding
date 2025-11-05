import Fuse from 'fuse.js';
import trainingData from '../config/supa_training.json';

const fuse = new Fuse(trainingData, {
  keys: ['question'],
  threshold: 0.4, // Lower = stricter match, higher = looser
});

export function matchQueryToTag(userInput) {
  const result = fuse.search(userInput);
  return result.length ? result[0].item.tag : 'unrecognized_query';
}