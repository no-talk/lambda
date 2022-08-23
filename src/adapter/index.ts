export * from "./gateway_proxy";
export * from "./authorizer";
export * from "./sqs";

import { Handler } from "aws-lambda";
import { report } from "../common/logger";
import { isAuthorizer, isEventBridge, isGatewayProxy, isSqs } from "../common/validators";
import { Lambda, Class } from "../types";
import { authorizerAdapter } from "./authorizer";
import { eventBridgeAdapter } from "./event_bridge";
import { gatewayProxyAdapter } from "./gateway_proxy";
import { sqsAdapter } from "./sqs";

export type Adapter<T, K> = (request: Class<T>, response: Class<K>) => (lambda: Lambda<T, K>) => Handler;

export const notalk =
  <Request, Response>(request: Class<Request>, response: Class<Response>) =>
  (lambda: Lambda<Request, Response>): Handler =>
  async (event, context, callback) => {
    report("Request :: ", event);

    const adapter: Adapter<Request, Response> = (() => {
      if (isSqs(event)) {
        return sqsAdapter;
      }

      if (isAuthorizer(event)) {
        return authorizerAdapter;
      }

      if (isEventBridge(event)) {
        return eventBridgeAdapter;
      }

      if (isGatewayProxy(event)) {
        return gatewayProxyAdapter;
      }

      throw Error();
    })();

    const result = await adapter(request, response)(lambda)(event, context, callback);

    report("Response :: ", result);

    return result;
  };
