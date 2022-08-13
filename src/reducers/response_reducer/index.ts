import { PrincipalIdMetadata, ResponseMetadata, SnakeCaseMetadata } from "@notalk/common";
import { ResponseReducer } from "@notalk/core";
import { ResponseReducerEvent } from "../../types";

export const responseReducer: ResponseReducer<ResponseReducerEvent> = (value, event, metadata) => {
  if (metadata instanceof ResponseMetadata) {
    const statusCode = metadata.args.value;

    return {
      ...value,
      statusCode,
    };
  }

  if (metadata instanceof SnakeCaseMetadata) {
    const toSnakeCase = (value: any): any => {
      if (value === null || value === undefined) {
        return undefined;
      }

      if (Array.isArray(value)) {
        return value.map(toSnakeCase);
      }

      if (value.constructor === Object) {
        const result: Record<string, any> = {};

        Object.entries(value).forEach(([key, value]) => {
          const mappedKey = key.replace(/[a-z][A-Z]/g, ([first, second]) => {
            return `${first}_${second.toLowerCase()}`;
          });

          result[mappedKey] = toSnakeCase(value);
        });

        return result;
      }

      return value;
    };

    return {
      ...value,
      [metadata.dist]: toSnakeCase(value[metadata.dist]),
    };
  }

  if (metadata instanceof PrincipalIdMetadata) {
    const principalId = value[metadata.dist];

    return {
      ...value,
      principalId,
    };
  }

  throw Error(`${Object.getPrototypeOf(metadata)?.constructor?.name} is not supported yet.`);
};
