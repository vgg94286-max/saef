import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // 1. استقبال البيانات كـ JSON من الـ Request Body
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Rider ID is required in JSON body" },
        { status: 400 }
      );
    }

    const portalApiUrl = process.env.PORTAL_API_URL;
    const authHeader = process.env.AUTH_HEADER_PORTAL_API;

    // 2. استدعاء الـ API الخارجي
    // ملاحظة: بما أن الـ API الخارجي يتوقع ID في الـ URL (GET)، سنمرره هناك
    const response = await fetch(`${portalApiUrl}/api/Members?id=${id}`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${authHeader}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "خطأ يرجى المحاولة لاحقًا" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("Internal Error:", error);
    return NextResponse.json(
      { error: "Invalid JSON or Server Error" },
      { status: 500 }
    );
  }
}