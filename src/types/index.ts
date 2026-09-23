export type Person = { id:string; name:string; dept:string; semester:string; avatar:string; interests:string[]; mutual?:string };
export type Post = { id:number; person:Person; time:string; text:string; image?:string; likes:number; comments:number; tag?:string };
