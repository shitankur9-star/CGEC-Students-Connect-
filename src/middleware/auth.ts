import type {Request,Response,NextFunction} from 'express';
import {verifyToken} from '../utils/token';
declare global { namespace Express { interface Request { user?:{id:string;role:string} } } }
export function authenticate(req:Request,res:Response,next:NextFunction){
 const token=req.cookies?.token||req.headers.authorization?.replace(/^Bearer\s+/i,'');
 if(!token)return res.status(401).json({error:'Authentication required'});
 try{const payload=verifyToken(token);req.user={id:payload.sub,role:payload.role};next()}catch{return res.status(401).json({error:'Session expired or invalid'})}
}
export function requireRole(...roles:string[]){return(req:Request,res:Response,next:NextFunction)=>{if(!req.user||!roles.includes(req.user.role))return res.status(403).json({error:'Insufficient permissions'});next()}}
