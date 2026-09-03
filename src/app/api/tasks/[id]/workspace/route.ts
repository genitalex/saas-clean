import { NextResponse } from 'next/server';
import { getTaskWorkspace } from '@/features/tasks/actions/service';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    return NextResponse.json(await getTaskWorkspace((await params).id));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'TASK_REQUEST_FAILED' },
      { status: 400 }
    );
  }
}
