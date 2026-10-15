// Ambient type declarations to ensure compilation even before npm dependencies are installed locally
declare module 'express' {
  export interface Request {
    body?: any;
    params: Record<string, string>;
    query: Record<string, string | string[] | undefined>;
    headers: Record<string, string | undefined>;
  }

  export interface Response {
    status(code: number): this;
    json(body: any): this;
    send(body?: any): this;
    setHeader(name: string, value: string): this;
  }

  export type RequestHandler = (req: Request, res: Response, next?: () => void) => any;

  export interface RouterInstance {
    get(path: string, ...handlers: RequestHandler[]): this;
    post(path: string, ...handlers: RequestHandler[]): this;
    put(path: string, ...handlers: RequestHandler[]): this;
    patch(path: string, ...handlers: RequestHandler[]): this;
    delete(path: string, ...handlers: RequestHandler[]): this;
    use(...handlers: any[]): this;
  }

  export interface ExpressApp extends RouterInstance {
    listen(port: number | string, callback?: () => void): any;
  }

  export type Router = RouterInstance;
  export function Router(): RouterInstance;
  export default express;
}

declare module 'cors' {
  import { RequestHandler } from 'express';
  function cors(options?: any): RequestHandler;
  export default cors;
}
