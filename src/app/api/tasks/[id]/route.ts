import { NextRequest, NextResponse } from 'next/server';
import { AuthContextError } from '@/lib/db/organization-context';
import {
  deleteTask,
  getTask,
  TaskServiceError,
  updateTask
} from '@/features/tasks/actions/service';

function errorResponse(error: unknown) {
  if (error instanceof AuthContextError) {
    const status = error.code === 'UNAUTHENTICATED' ? 401 : 403;
    return NextResponse.json({ error: error.code }, { status });
  }
  if (error instanceof TaskServiceError) {
    const status = error.code === 'NOT_FOUND' ? 404 : 400;
    return NextResponse.json({ error: error.code }, { status });
  }
  console.error('[tasks]', error);
  return NextResponse.json({ error: 'TASK_REQUEST_FAILED' }, { status: 500 });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return NextResponse.json(await getTask((await params).id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return NextResponse.json(await updateTask((await params).id, await request.json()));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return NextResponse.json(await deleteTask((await params).id));
  } catch (error) {
    return errorResponse(error);
  }
}
