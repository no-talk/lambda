import {
  BadRequestException,
  BearerAuthMetadata,
  BodyMetadata,
  ContextMetadata,
  CookieMetadata,
  DomainMetadata,
  FilesMetadata,
  HeaderMetadata,
  IsBooleanArrayMetadata,
  IsBooleanMetadata,
  IsDateMetadata,
  IsMatchedMetadata,
  IsNestedArrayMetadata,
  IsNestedMetadata,
  IsNumberArrayMetadata,
  IsNumberMetadata,
  IsOneOfArrayMetadata,
  IsOneOfMetadata,
  IsStringArrayMetadata,
  IsStringMetadata,
  MethodNotAllowed,
  NotFoundException,
  PathMetadata,
  QueryMetadata,
  RawBodyMetadata,
  RequestMetadata,
  RequiredMetadata,
} from "@notalk/common";
import { calculateRequest, RequestReducer } from "@notalk/core";
import { getBoundary, Parse as parse } from "parse-multipart";
import { isAuthorizerInReducer, isEventBridgeInReducer, isGatewayProxyInReducer, isSqsInReducer } from "../../common/validators";
import { RequestReducerEvent } from "../../types";
import { validate, each, isBoolean, isString, isNumber, isOneOf, isMatched } from "./validate";

const ALIAS_BODY = "__body__";

export const requestReducer: RequestReducer<RequestReducerEvent> = (value, event, metadata) => {
  if (metadata instanceof ContextMetadata) {
    if (isSqsInReducer(event) || isEventBridgeInReducer(event)) {
      return value;
    }

    if (metadata.args.key) {
      return {
        ...value,
        [metadata.dist]: event.requestContext.authorizer?.[metadata.args.key],
      };
    }

    return {
      ...value,
      [metadata.dist]: event.requestContext.authorizer,
    };
  }

  if (metadata instanceof DomainMetadata) {
    if (isSqsInReducer(event)) {
      return value;
    }

    if (isEventBridgeInReducer(event)) {
      return {
        ...value,
        [metadata.dist]: event.source,
      };
    }

    return {
      ...value,
      [metadata.dist]: event.requestContext.domainName,
    };
  }

  if (metadata instanceof CookieMetadata) {
    if (!isGatewayProxyInReducer(event) && !isAuthorizerInReducer(event)) {
      return value;
    }

    const cookies = event.headers?.["Cookie"] || event.headers?.["cookie"];

    if (!cookies) {
      return value;
    }

    const result = cookies
      .split(";")
      .find((c) => c.split("=")[0] === metadata.args.key)
      ?.split("=")[1];

    return {
      ...value,
      [metadata.dist]: result,
    };
  }

  if (metadata instanceof RequestMetadata) {
    if (!isGatewayProxyInReducer(event)) {
      return value;
    }

    const { method, path } = metadata.args;

    if (event.httpMethod.toLowerCase() !== method.toLowerCase()) {
      throw new MethodNotAllowed();
    }

    const pathRegex = new RegExp(path?.startsWith("/") ? "" : "/" + (path ? path.replace(/\/:.*\//, "/.*/") : ""));

    if (!pathRegex.test(event.path)) {
      throw new NotFoundException();
    }

    return value;
  }

  if (metadata instanceof RequiredMetadata) {
    const that = value[metadata.dist];

    if (that === null || typeof that === "undefined") {
      throw new BadRequestException();
    }

    return value;
  }

  if (metadata instanceof QueryMetadata) {
    if (isSqsInReducer(event) || isEventBridgeInReducer(event)) {
      return value;
    }

    return {
      ...value,
      [metadata.dist]: event.queryStringParameters?.[metadata.args.key],
    };
  }

  if (metadata instanceof PathMetadata) {
    if (isSqsInReducer(event) || isEventBridgeInReducer(event)) {
      return value;
    }

    return {
      ...value,
      [metadata.dist]: event.pathParameters?.[metadata.args.key],
    };
  }

  if (metadata instanceof RawBodyMetadata) {
    if (isAuthorizerInReducer(event)) {
      return value;
    }

    if (isEventBridgeInReducer(event)) {
      return {
        ...value,
        [metadata.dist]: event.detail,
      };
    }

    return {
      ...value,
      [metadata.dist]: event.body,
    };
  }

  if (metadata instanceof BodyMetadata) {
    if (!value[ALIAS_BODY]) {
      if (isEventBridgeInReducer(event)) {
        if (!event.detail) {
          value[ALIAS_BODY] = {};
        } else {
          value[ALIAS_BODY] = event.detail;
        }
      } else if (!isAuthorizerInReducer(event)) {
        if (!event.body) {
          value[ALIAS_BODY] = {};
        } else {
          value[ALIAS_BODY] = JSON.parse(event.body);
        }
      }
    }

    if (metadata.args.key) {
      const result = (value[ALIAS_BODY] as any)[metadata.args.key];

      delete (value[ALIAS_BODY] as any)[metadata.args.key];

      return {
        ...value,
        [metadata.dist]: result,
      };
    }

    const result = value[ALIAS_BODY];

    delete value[ALIAS_BODY];

    return {
      ...value,
      [metadata.dist]: result,
    };
  }

  if (metadata instanceof HeaderMetadata) {
    if (isSqsInReducer(event) || isEventBridgeInReducer(event)) {
      return value;
    }

    const result = event.headers?.[metadata.args.key];

    if (result) {
      return {
        ...value,
        [metadata.dist]: result,
      };
    }

    return {
      ...value,
      [metadata.dist]: event.headers?.[metadata.args.key.toLowerCase()],
    };
  }

  if (metadata instanceof FilesMetadata) {
    if (!isGatewayProxyInReducer(event)) {
      return value;
    }

    if (!event.body) {
      return value;
    }

    const contentType = event.headers?.["Content-Type"] || event.headers?.["content-type"];

    if (!contentType) {
      return value;
    }

    const buffer = Buffer.from(event.body.toString(), "base64");

    const boundary = getBoundary(contentType);

    const result = parse(buffer, boundary);

    return {
      ...value,
      [metadata.dist]: result,
    };
  }

  if (metadata instanceof BearerAuthMetadata) {
    if (isSqsInReducer(event) || isEventBridgeInReducer(event)) {
      return value;
    }

    return {
      ...value,
      [metadata.dist]: event.headers?.[isAuthorizerInReducer(event) ? "authorization" : "Authorization"]?.replace("Bearer ", ""),
    };
  }

  if (metadata instanceof IsBooleanMetadata) {
    validate(value[metadata.dist])(isBoolean);

    return value;
  }

  if (metadata instanceof IsBooleanArrayMetadata) {
    validate(value[metadata.dist])(each(isBoolean));

    return value;
  }

  if (metadata instanceof IsStringMetadata) {
    validate(value[metadata.dist])(isString);

    return value;
  }

  if (metadata instanceof IsStringArrayMetadata) {
    validate(value[metadata.dist])(each(isString));

    return value;
  }

  if (metadata instanceof IsNumberMetadata) {
    validate(value[metadata.dist])(isNumber);

    return value;
  }

  if (metadata instanceof IsNumberArrayMetadata) {
    validate(value[metadata.dist])(each(isNumber));

    return value;
  }

  if (metadata instanceof IsDateMetadata) {
    const prop = value[metadata.dist];

    if (!prop) {
      return value;
    }

    if (typeof prop !== "string" && typeof prop !== "number") {
      throw new BadRequestException();
    }

    const date = new Date(prop);

    if (isNaN(date.getTime())) {
      throw new BadRequestException();
    }

    return {
      ...value,
      [metadata.dist]: date,
    };
  }

  if (metadata instanceof IsOneOfMetadata) {
    validate(value[metadata.dist])(isOneOf(metadata.args.array));

    return value;
  }

  if (metadata instanceof IsOneOfArrayMetadata) {
    validate(value[metadata.dist])(each(isOneOf(metadata.args.array)));

    return value;
  }

  if (metadata instanceof IsMatchedMetadata) {
    validate(value[metadata.dist])(isMatched(metadata.args.regex));

    return value;
  }

  if (metadata instanceof IsNestedMetadata) {
    if (!value[metadata.dist]) {
      return value;
    }

    return {
      ...value,
      [metadata.dist]: calculateRequest({ [ALIAS_BODY]: value[metadata.dist] }, event, requestReducer, metadata.args.type),
    };
  }

  if (metadata instanceof IsNestedArrayMetadata) {
    const prop = value[metadata.dist];

    if (!prop) {
      return value;
    }

    if (!Array.isArray(prop)) {
      throw new BadRequestException();
    }

    return {
      ...value,
      [metadata.dist]: prop.map((element) => calculateRequest({ [ALIAS_BODY]: element }, event, requestReducer, metadata.args.type)),
    };
  }

  throw Error(`${Object.getPrototypeOf(metadata)?.constructor?.name} is not supported yet.`);
};
