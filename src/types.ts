export type Lambda<Input, Output> = (input: Input) => Promise<Output>;

export type ResponseData = {
  statusCode?: number;
  headers?: Record<string, string>;
  body?: any;
};
