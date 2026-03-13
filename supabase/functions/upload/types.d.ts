declare module "@std/http" {
  export function serve(
    handler: (req: Request) => Response | Promise<Response>,
  ): void;
}