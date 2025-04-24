import { isArray, isObject, mapKeys, snakeCase } from 'lodash';

export function camelToSnake(input: any): any {
  if (isArray(input)) {
    return input.map(camelToSnake);
  } else if (isObject(input)) {
    return mapKeys(input, (_value, key) => snakeCase(key));
  }
  return input;
}
