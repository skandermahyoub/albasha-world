import SocialEngagement from '@/components/social/SocialEngagement';

export default function VideoEngagementPanel({ video }) {
  if (!video) return null;
  return (
    <div className="p-4 bg-background">
      <SocialEngagement
        contentType="video"
        contentId={video.id}
        title={video.title}
        shareText={video.description || video.title}
      />
    </div>
  );
}