import { NextRequest, NextResponse } from 'next/server';
import { AuthContextError } from '@/lib/db/organization-context';
import {
  ActivityServiceError,
  createActivity,
  getCustomerActivities
} from '@/features/activities/actions/service';

function errorResponse(error: unknown) {
  if (error instanceof AuthContextError) {
    return NextResponse.json(
      { error: error.code },
      { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 }
    );
  }
  if (error instanceof ActivityServiceError) {
    const status = error.code === 'INVALID_CUSTOMER' ? 404 : 400;
    return NextResponse.json({ error: error.code }, { status });
  }
  console.error('[customer-activities]', error);
  return NextResponse.json({ error: 'ACTIVITY_REQUEST_FAILED' }, { status: 500 });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return NextResponse.json(await getCustomerActivities((await params).id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return NextResponse.json(await createActivity((await params).id, await request.json()), {
      status: 201
    });
  } catch (error) {
    return errorResponse(error);
  }
}
