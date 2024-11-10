import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,);

export async function POST(request: Request) {
    const calevents = await request.json();
    const { data, error } = await supabase
        .from('calenderevents')
        .insert(calevents.map(event => ({ eventvalue: event })));

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
}