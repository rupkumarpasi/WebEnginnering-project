import {z} from "zod";

const portSchema = z.coerce.number().default(3001);

export const PORT = portSchema.parse(process.env.PORT);
