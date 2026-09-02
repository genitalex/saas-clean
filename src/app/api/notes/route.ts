import { AuthContextError } from '@/lib/db/organization-context';
import { createNote, getNotes, NoteServiceError } from '@/features/notes/actions/service';
import { NextRequest, NextResponse } from 'next/server';

function errorResponse(error: unknown) {
  if (error instanceof AuthContextError)
    return NextResponse.json(
      { error: error.code },
      { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 }
    );
  if (error instanceof NoteServiceError)
    return NextResponse.json(
      { error: error.code },
      { status: error.code === 'NOT_FOUND' ? 404 : 400 }
    );
  console.error('[notes]', error);
  return NextResponse.json({ error: 'NOTE_REQUEST_FAILED' }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(
      await getNotes(request.nextUrl.searchParams.get('search') || undefined)
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(await createNote(await request.json()), { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError)
      return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
    return errorResponse(error);
  }
}
