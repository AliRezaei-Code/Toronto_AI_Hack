import React from 'react';
import { Composition, getInputProps } from 'remotion';
import { VideoComposition } from './VideoComposition';
import { AIDirectedShort, AIDirectedShortProps } from './components/ai-director';

// Default props for AI Director composition (used in Remotion Studio)
const defaultAIDirectorProps: AIDirectedShortProps = {
  jobId: 'preview',
  clipId: 'preview-clip',
  videoSources: [],
  words: [],
  sourceWidth: 1920,
  sourceHeight: 1080,
  captionStyle: 'hormozi',
  platform: 'tiktok',
  includeCaptions: true,
  mainVolume: 1,
  musicVolume: 0.1,
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Original compositions */}
      <Composition
        id="VideoEditor"
        component={VideoComposition}
        durationInFrames={300} // 10 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ShortForm"
        component={VideoComposition}
        durationInFrames={180} // 6 seconds at 30fps
        fps={30}
        width={1080}
        height={1920}
      />
      
      {/* AI Director compositions for viral shorts */}
      <Composition
        id="AIDirectedShort-TikTok"
        component={AIDirectedShort}
        durationInFrames={1800} // 60 seconds at 30fps (max TikTok length)
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultAIDirectorProps}
      />
      <Composition
        id="AIDirectedShort-Reels"
        component={AIDirectedShort}
        durationInFrames={2700} // 90 seconds at 30fps (max Reels length)
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          ...defaultAIDirectorProps,
          platform: 'instagram',
        }}
      />
      <Composition
        id="AIDirectedShort-Shorts"
        component={AIDirectedShort}
        durationInFrames={1800} // 60 seconds at 30fps (YouTube Shorts)
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          ...defaultAIDirectorProps,
          platform: 'youtube',
        }}
      />
    </>
  );
};