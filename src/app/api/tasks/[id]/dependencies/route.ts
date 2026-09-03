import { NextResponse } from 'next/server';
import {
  addTaskDependency,
  removeTaskDependency,
  TaskServiceError
} from '@/features/tasks/actions/service';

function responseError(error: unknown) {
  const status = error instanceof TaskServiceError && error.code === 'NOT_FOUND' ? 404 : 400;
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'TASK_REQUEST_FAILED' },
    { status }
  );
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = (await request.json()) as { blockingTaskId?: string };
    if (!body.blockingTaskId)
      return NextResponse.json({ error: 'blockingTaskId is required' }, { status: 400 });
    return NextResponse.json(await addTaskDependency((await params).id, body.blockingTaskId));
  } catch (error) {
    return responseError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const blockingTaskId = new URL(request.url).searchParams.get('blockingTaskId');
    if (!blockingTaskId)
      return NextResponse.json({ error: 'blockingTaskId is required' }, { status: 400 });
    return NextResponse.json(await removeTaskDependency((await params).id, blockingTaskId));
  } catch (error) {
    return responseError(error);
  }
}
