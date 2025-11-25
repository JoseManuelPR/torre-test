import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const searchParams = request.nextUrl.searchParams;
    
    const size = searchParams.get("size") || "10";
    
    const response = await fetch(
      `https://search.torre.co/opportunities/_search?currency=USD&periodicity=hourly&lang=en&size=${size}&contextFeature=job_feed`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

