import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";



const s3 = new S3Client({
  region: "auto",
  forcePathStyle: true,
  endpoint: process.env.ELASTIC_LAKE_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.ELASTIC_LAKE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.ELASTIC_LAKE_SECRET_ACCESS_KEY!,
  },
});


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, licenseFile, clubImages, clubName, licenseExpiry, email } = body;

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    if (!clubName || !licenseExpiry || !email)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const signedUrls: { licenseUrl: string; clubUrls: string[] } = {
      licenseUrl: "",
      clubUrls: [],
    };

    if (licenseFile) {
      const licenseKey = `uploads/${userId}/license-${crypto.randomBytes(8).toString("hex")}-${licenseFile.name}`;
      const licenseCommand = new PutObjectCommand({
        Bucket: process.env.ELASTIC_LAKE_BUCKET_NAME!,
        Key: licenseKey,
        ContentType: licenseFile.type,
      
        
      });
      signedUrls.licenseUrl = await getSignedUrl(s3, licenseCommand, { expiresIn: 300 });
    }

    if (Array.isArray(clubImages)) {
      for (const file of clubImages) {
        const imgKey = `uploads/${userId}/club-${crypto.randomBytes(8).toString("hex")}-${file.name}`;
        const imgCommand = new PutObjectCommand({
          Bucket: process.env.ELASTIC_LAKE_BUCKET_NAME!,
          Key: imgKey,
          ContentType: file.type,
           
          
        });
        signedUrls.clubUrls.push(await getSignedUrl(s3, imgCommand, { expiresIn: 300 }));
      }
    }

    return NextResponse.json({ ...signedUrls, clubName, licenseExpiry, email });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to generate signed URLs" }, { status: 500 });
  }
}