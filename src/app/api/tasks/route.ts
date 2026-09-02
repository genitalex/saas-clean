import { NextRequest, NextResponse } from 'next/server';
import { AuthContextError } from '@/lib/db/organization-context';
import { createTask, getTasks, TaskServiceError } from '@/features/tasks/actions/service';
import { taskStatusSchema } from '@/features/tasks/schemas/task';
import type { TaskFilters } from '@/features/tasks/types';

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

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const status = params.get('status');
  if (status && !taskStatusSchema.safeParse(status).success) {
    return NextResponse.json({ error: 'INVALID_STATUS' }, { status: 400 });
  }
  try {
    const filters: TaskFilters = {
      status: status ? (status as TaskFilters['status']) : undefined,
      customerId: params.get('customerId') || undefined,
      eventId: params.get('eventId') || undefined,
      assigneeId: params.get('assigneeId') || undefined,
      search: params.get('search') || undefined
    };
    return NextResponse.json(await getTasks(filters));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(await createTask(await request.json()), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
