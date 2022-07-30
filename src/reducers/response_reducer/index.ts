import { SnakeCaseMetadata, StatusCodeMetadata } from "@notalk/common";
import { ResponseReducer } from "@notalk/core";
import { ResponseData } from "../../types";

export const responseReducer: ResponseReducer<ResponseData> = (value, metadata) => {
  if (metadata instanceof StatusCodeMetadata) {
    return {
      ...value,
      statusCode: metadata.args.value,
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
      body: toSnakeCase(value.body),
    };
  }

  throw Error(`${Object.getPrototypeOf(metadata)?.constructor?.name} is not supported yet.`);
};
