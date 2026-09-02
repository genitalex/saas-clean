import { NextRequest, NextResponse } from 'next/server';
import { AuthContextError } from '@/lib/db/organization-context';
import { getActivities } from '@/features/activities/actions/service';

export async function GET(request: NextRequest) {
  try {
    const limit = Number(request.nextUrl.searchParams.get('limit') || 100);
    return NextResponse.json(await getActivities(Number.isFinite(limit) ? limit : 100));
  } catch (error) {
    if (error instanceof AuthContextError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 }
      );
    }
    console.error('[activities:get]', error);
    return NextResponse.json({ error: 'ACTIVITY_REQUEST_FAILED' }, { status: 500 });
  }
}
