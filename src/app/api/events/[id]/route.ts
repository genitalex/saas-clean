import { NextRequest, NextResponse } from 'next/server';
import { AuthContextError } from '@/lib/db/organization-context';
import {
  deleteEvent,
  EventServiceError,
  getEvent,
  updateEvent
} from '@/features/calendar/actions/service';

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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return NextResponse.json(await getEvent((await params).id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return NextResponse.json(await updateEvent((await params).id, await request.json()));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return NextResponse.json(await deleteEvent((await params).id));
  } catch (error) {
    return errorResponse(error);
  }
}
