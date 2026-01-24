import React from 'react';
import { Composition } from 'remotion';
import { VideoComposition } from './VideoComposition';

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
    </>
  );
};