import { BadRequestException } from "@notalk/common";
import { Predicate } from "./types";

export const validate = (value: unknown) => (predicate: Predicate) => {
  if (!value) return value;

  if (!predicate(value)) {
    throw new BadRequestException();
  }
};

export const each = (predicate: Predicate) => (array: unknown) => {
  if (!Array.isArray(array)) {
    throw new BadRequestException();
  }

  return array.every(predicate);
};

export const isBoolean: Predicate = (value) => typeof value === "boolean";

export const isString: Predicate = (value) => typeof value === "string";

export const isNumber: Predicate = (value) => typeof value === "number";

export const isOneOf = (array: readonly unknown[]) => (value: unknown) => array.includes(value);

export const isMatched = (regexp: RegExp) => (value: unknown) => {
  if (typeof value !== "string") {
    return false;
  }

  return regexp.test(value);
};
