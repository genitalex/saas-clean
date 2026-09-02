import { AuthContextError } from '@/lib/db/organization-context';
import {
  deleteNote,
  getNote,
  NoteServiceError,
  updateNote
} from '@/features/notes/actions/service';
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

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    return NextResponse.json(await getNote((await params).id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    return NextResponse.json(await updateNote((await params).id, await request.json()));
  } catch (error) {
    if (error instanceof SyntaxError)
      return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    return NextResponse.json(await deleteNote((await params).id));
  } catch (error) {
    return errorResponse(error);
  }
}
