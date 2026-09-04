import PageContainer from '@/components/layout/page-container';
import GlassLabEditor from '@/components/ui/glass-lab/editor';

export const metadata = { title: 'Dashboard: Glass Lab' };

export default function GlassLabPage() {
  return (
    <PageContainer
      pageTitle='Glass Lab'
      pageDescription='Editor visual aislado del material LiquidGlass.'
    >
      <GlassLabEditor />
    </PageContainer>
  );
}
