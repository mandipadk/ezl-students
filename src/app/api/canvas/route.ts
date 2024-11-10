import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,);

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { access_token, user_id } = data;

        if (!access_token || !user_id) {
            return NextResponse.json({ status: "error", message: "Missing access token or user ID" }, { status: 400 });
        }

        const { error } = await supabase
            .from('canvas_tokens')
            .insert([{ access_token, user_id }]);

        if (error) {
            return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
        }

        return NextResponse.json({ status: "success", message: "Access token and user ID received" }, { status: 200 });
    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ status: "error", message: "Invalid request data" }, { status: 400 });
    }
}