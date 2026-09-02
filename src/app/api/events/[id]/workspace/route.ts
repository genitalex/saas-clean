import { NextResponse } from 'next/server';
import { AuthContextError } from '@/lib/db/organization-context';
import { getEventWorkspace, EventServiceError } from '@/features/calendar/actions/service';

function errorResponse(error: unknown) {
  if (error instanceof AuthContextError) {
    return NextResponse.json(
      { error: error.code },
      { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 }
    );
  }
  if (error instanceof EventServiceError) {
    return NextResponse.json(
      { error: error.code },
      { status: error.code === 'NOT_FOUND' ? 404 : 400 }
    );
  }
  console.error('[event-workspace]', error);
  return NextResponse.json({ error: 'EVENT_WORKSPACE_REQUEST_FAILED' }, { status: 500 });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    return NextResponse.json(await getEventWorkspace((await params).id));
  } catch (error) {
    return errorResponse(error);
  }
}
