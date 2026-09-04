import { NextRequest, NextResponse } from 'next/server';
import * as service from '@/features/automations/api/service';
import { AuthContextError, getAuthContext } from '@/lib/db/organization-context';
import {
  checkAndProcessOverdueTasks,
  checkAndProcessWaitingTasks
} from '@/features/automations/services/execution';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  try {
    const { organization, user } = await getAuthContext();
    await Promise.all([
      checkAndProcessOverdueTasks(organization.id),
      checkAndProcessWaitingTasks(organization.id)
    ]);
    const refEntityType = searchParams.get('refEntityType');
    const refEntityId = searchParams.get('refEntityId');
    if (refEntityType && refEntityId) {
      const attentionItems = await service.getAttentionItemsForEntity(
        refEntityType,
        refEntityId,
        organization.id,
        user.id
      );
      return NextResponse.json(attentionItems);
    }
    const status = searchParams.get('status') || 'active';
    const attentionItems = await service.getAttentionItems(organization.id, user.id, status);
    return NextResponse.json(attentionItems);
  } catch (error) {
    if (error instanceof AuthContextError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 }
      );
    }
    console.error('[attention-list]', error);
    return NextResponse.json({ error: 'ATTENTION_REQUEST_FAILED' }, { status: 500 });
  }
}
