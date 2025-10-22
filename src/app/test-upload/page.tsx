import TestUploadComponent from '@/components/TestUploadComponent';
import { NotificationDebugPanel } from '@/components/NotificationDebugPanel';
import { NotificationTestPanel } from '@/components/NotificationTestPanel';

export default function TestUploadPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 space-y-8">
        <TestUploadComponent />
        <NotificationTestPanel />
        <NotificationDebugPanel />
      </div>
    </div>
  );
}

