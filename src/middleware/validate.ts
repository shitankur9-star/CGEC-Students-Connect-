import type {Request,Response,NextFunction} from 'express';
import type {ZodSchema} from 'zod';
export const validate=(schema:ZodSchema)=>(req:Request,res:Response,next:NextFunction)=>{const parsed=schema.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'Invalid input',details:parsed.error.flatten()});req.body=parsed.data;next()};
