import { NextRequest, NextResponse } from 'next/server';
import { AuthContextError } from '@/lib/db/organization-context';
import { createEvent, EventServiceError, getEvents } from '@/features/calendar/actions/service';
import type { EventFilters } from '@/features/calendar/types';

function errorResponse(error: unknown) {
  if (error instanceof AuthContextError) {
    return NextResponse.json(
      { error: error.code },
      { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 }
    );
  }
  if (error instanceof EventServiceError) {
    const status = error.code === 'NOT_FOUND' ? 404 : 400;
    return NextResponse.json({ error: error.code }, { status });
  }
  console.error('[events]', error);
  return NextResponse.json({ error: 'EVENT_REQUEST_FAILED' }, { status: 500 });
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const filters: EventFilters = {
    startDate: params.get('startDate') || undefined,
    endDate: params.get('endDate') || undefined,
    customerId: params.get('customerId') || undefined,
    assigneeId: params.get('assigneeId') || undefined,
    search: params.get('search') || undefined
  };
  try {
    return NextResponse.json(await getEvents(filters));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(await createEvent(await request.json()), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
