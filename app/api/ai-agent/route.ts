// app/api/ai-agent/route.ts
import { createClient } from '@/lib/supabase/server'
import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, sessionId } = await request.json()

    // Get tenant data
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('owner_id', user.id)
      .single()

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Get current stats
    const { data: stats } = await supabase.rpc('get_tenant_stats', {
      tenant_uuid: tenant.id
    })

    // Get recent context (last 5 messages)
    const { data: recentChats } = await supabase
      .from('ai_conversations')
      .select('message, response')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })
      .limit(5)

    const systemPrompt = `You are Rambo, an AI hospitality manager for Room Rent Pro, a property management system for Pakistan.

Property: ${tenant.name}
Type: ${tenant.type}
Location: ${tenant.city || 'Pakistan'}
Plan: ${tenant.plan}

Current Status:
- Total Rooms: ${stats?.total_rooms || 0}
- Available: ${stats?.available_rooms || 0}
- Occupied: ${stats?.occupied_rooms || 0}
- Occupancy Rate: ${stats?.occupancy_rate || 0}%
- Month Revenue: Rs. ${stats?.month_revenue || 0}

Payment Methods:
- JazzCash: ${tenant.jazzcash_number || 'Not set'}
- EasyPaisa: ${tenant.easypaisa_number || 'Not set'}

You can help with:
1. Room availability (in English, Urdu, Roman Urdu)
2. Creating bookings
3. Payment processing
4. Revenue reports
5. Guest management

Be professional, friendly, and efficient. For bookings, always confirm details. Use Roman Urdu when user uses Urdu script.

Example responses:
- "Ji haan, aapke paas ${stats?.available_rooms || 0} rooms available hain."
- "Room 101 available hai. Rate: Rs. 3,000/night."
- "Aapka monthly revenue Rs. ${stats?.month_revenue || 0} hai."`

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        ...recentChats?.reverse().flatMap((chat: any) => [
          { role: "user", content: chat.message },
          { role: "assistant", content: chat.response }
        ]) || [],
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    const aiResponse = completion.choices[0].message.content

    // Save conversation
    await supabase.from('ai_conversations').insert({
      tenant_id: tenant.id,
      user_id: user.id,
      session_id: sessionId || crypto.randomUUID(),
      message,
      response: aiResponse,
      intent: detectIntent(message)
    })

    return NextResponse.json({ response: aiResponse })

  } catch (error) {
    console.error('AI Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' }, 
      { status: 500 }
    )
  }
}

function detectIntent(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('book') || lower.includes('reserve')) return 'booking'
  if (lower.includes('available') || lower.includes('room') || lower.includes('kya')) return 'availability'
  if (lower.includes('price') || lower.includes('rate') || lower.includes('kitne')) return 'pricing'
  if (lower.includes('pay') || lower.includes('jazzcash') || lower.includes('easypaisa')) return 'payment'
  if (lower.includes('revenue') || lower.includes('income') || lower.includes('earning')) return 'revenue'
  return 'general'
}
