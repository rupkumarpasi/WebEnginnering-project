
export class HttpError extends Error {
  constructor(status,title,detail,extras={}) {
    super(detail ?? title);
    this.name = 'HttpError';
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.extras = extras; // extra JSON fields, e.g. { errors: [...] }
  }
}

export const badRequest = (detail , error) => new HttpError(400, "Bad Request", detail,
     error ? {error} : {});


     export const notFound = (detail) =>new HttpError(404, "Not Found", detail);


     export const conflict = (detail) => new HttpError(409, "Conflict", detail);

     export const internalServerError = (detail) => new HttpError(500, "Internal Server Error", detail);

     export const unauthorizedError = (detail) => new HttpError(401, "Unauthorized", detail);




