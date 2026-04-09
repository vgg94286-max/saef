// lib/sendpulse.ts

// 1. دالة لجلب رمز المرور (Access Token)
async function getSendPulseToken() {
  const res = await fetch(`${process.env.SENDPULSE_ENDPOINT}/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.SENDPULSE_ID,
      client_secret: process.env.SENDPULSE_SECRET,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    // سيطبع لك هنا السبب الحقيقي (مثل: invalid_client أو unauthorized)
    console.error("SendPulse Token Error Details:", data);
    throw new Error(`فشل في الحصول على التوكن: ${data.error || res.statusText}`);
  }

  return data.access_token;
}

interface SendEmailProps {
  to: string;
  subject: string;
  html: string;
  attachmentUrl?: string;
  attachmentName?: string;
}

// 2. دالة إرسال البريد
export async function sendPulseEmail({ to, subject, html, attachmentUrl, attachmentName }: SendEmailProps) {
  try {
    const token = await getSendPulseToken();
    let attachments: Record<string, string> = {};

    // إذا كان هناك مرفق (تقرير الزيارة)، نجلبه ونحوله إلى Base64
    if (attachmentUrl && attachmentName) {
      const fileRes = await fetch(attachmentUrl);
      if (fileRes.ok) {
        const arrayBuffer = await fileRes.arrayBuffer();
        // SendPulse يقبل المرفقات ككائن: { "filename.pdf": "base64_string" }
        attachments[attachmentName] = Buffer.from(arrayBuffer).toString("base64");
      }
    }

    // تجهيز بيانات البريد (SendPulse يطلب أن يكون الـ HTML مشفراً بـ Base64 أيضاً)
    const emailData = {
      email: {
        html: Buffer.from(html).toString("base64"),
        text: "يرجى تفعيل الـ HTML لعرض هذه الرسالة.",
        subject: subject,
        from: {
          name: "الاتحاد السعودي للفروسية والبولو",
          email: process.env.SENDPULSE_FROM_EMAIL,
        },
        to: [{ email: to }],
        // إضافة المرفقات فقط إذا كانت موجودة
        ...(Object.keys(attachments).length > 0 && { attachments }),
      },
    };

    // إرسال الطلب إلى SendPulse SMTP API
    const sendRes = await fetch(`${process.env.SENDPULSE_ENDPOINT}/smtp/emails`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    const sendResult = await sendRes.json();
    
    if (!sendRes.ok || sendResult.is_error) {
      console.error("SendPulse Error:", sendResult);
      return { success: false, error: sendResult };
    }

    return { success: true, data: sendResult };
  } catch (error) {
    console.error("Mail Service Error:", error);
    return { success: false, error };
  }
}