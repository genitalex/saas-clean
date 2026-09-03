import { NextRequest, NextResponse } from 'next/server';
import * as service from '@/features/automations/api/service';
import { getAuthContext } from '@/lib/db/organization-context';
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
    const attentionItems = await service.getAttentionItems(organization.id, user.id);
    return NextResponse.json(attentionItems);
  } catch {
    return NextResponse.json({ error: 'ATTENTION_REQUEST_FAILED' }, { status: 401 });
  }
}
