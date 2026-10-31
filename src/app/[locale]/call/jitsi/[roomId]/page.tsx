'use client';

import { useParams, useRouter } from 'next/navigation';
import { JitsiMeeting } from '@jitsi/react-sdk';

export default function JitsiCallPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string;
  const locale = (params?.locale as string) || 'en';

  return (
    <div className="h-[100dvh] w-full bg-[#0f172a]">
      <JitsiMeeting
        domain="meet.jit.si"
        roomName={`thimlilith-${roomId}`}
        configOverwrite={{
          startWithAudioMuted: true,
          startWithVideoMuted: false,
          prejoinConfig: { enabled: true }, // 👈 Shows the camera setup screen
        }}
        interfaceConfigOverwrite={{
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          MOBILE_APP_PROMO: false, 
        }}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = '100%';
          iframeRef.style.width = '100%';
        }}
        onReadyToClose={() => {
          // 👈 WHEN THEY CLICK THE RED HANG-UP BUTTON, SEND THEM BACK
          router.push(`/${locale}/rooms/${roomId}`);
        }}
      />
    </div>
  );
}