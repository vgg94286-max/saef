import { sql } from "@/lib/db";




export async function POST(request: Request) {
    
    try {  

        const { email } = await request.json();
        console.log("Email received:", email);
        if (!email ) {
            return Response.json({ error: "Email is required" }, { status: 400 })
        }
       
        const records = await sql`
        SELECT * FROM public.users
        WHERE email = ${email}`;

        if (!records || records.length === 0) {
            return Response.json({ error: "No user info found" }, { status: 404 })
        }

        return Response.json({
            success: true,
            userInfo: records,
        })

     }
    catch (error) {
        console.error("[User Info Error]", error)
        return Response.json({ error: "Failed to get user info" }, { status: 500 })
    }



}
