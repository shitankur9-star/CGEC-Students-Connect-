import jwt from 'jsonwebtoken';
export type AuthPayload = { sub:string; role:'STUDENT'|'MODERATOR'|'ADMIN' };
const secret=process.env.JWT_SECRET;
if(!secret && process.env.NODE_ENV==='production') throw new Error('JWT_SECRET must be configured in production');
export const signToken=(payload:AuthPayload)=>jwt.sign(payload,secret||'development-only-secret-change-me',{expiresIn:'7d',issuer:'cgec-connect'});
export const verifyToken=(token:string)=>jwt.verify(token,secret||'development-only-secret-change-me',{issuer:'cgec-connect'}) as AuthPayload;
