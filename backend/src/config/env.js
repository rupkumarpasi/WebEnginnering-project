function convertStringToNumber(value, fallback=0)
{
    return isNaN(Number(value)) ? fallback : Number(value);
}

export const config = Object.freeze({
    port: convertStringToNumber(process.env.PORT,3000),
      env: process.env.NODE_ENV ?? 'development',
  host: process.env.HOST ?? '127.0.0.1',
  bodyLimit: process.env.BODY_LIMIT ?? '100kb',
  isTest: process.env.NODE_ENV === 'test',
});


