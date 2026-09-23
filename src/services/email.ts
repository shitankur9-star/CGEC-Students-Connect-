import nodemailer from 'nodemailer';

export async function sendVerificationEmail(to:string,token:string){
  const link=`${process.env.FRONTEND_ORIGIN||'http://localhost:5173'}/?verify=${encodeURIComponent(token)}`;
  if(process.env.SMTP_HOST&&process.env.SMTP_USER&&process.env.SMTP_PASSWORD){
    const transporter=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:Number(process.env.SMTP_PORT)===465,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}});
    await transporter.sendMail({from:process.env.EMAIL_FROM||process.env.SMTP_USER,to,subject:'Verify your CGEC Connect email',text:`Verify your institutional email to join CGEC Connect: ${link}`,html:`<p>Verify your institutional email to join CGEC Connect.</p><p><a href="${link}">Verify email</a></p><p>This link expires in 24 hours.</p>`});
    return;
  }
  if(process.env.NODE_ENV==='production')throw new Error('Email delivery is not configured');
  console.info(`Development verification link for ${to}: ${link}`);
}
