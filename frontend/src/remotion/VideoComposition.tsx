import React from 'react';
import { 
  useCurrentFrame, 
  useVideoConfig, 
  spring, 
  interpolate 
} from 'remotion';
import { BackgroundGradient } from './components/BackgroundGradient';
import { TextAnimation } from './components/TextAnimation';
import { AudioVisualizer } from './components/AudioVisualizer';
import { Transition } from './components/Transition';

export const VideoComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  
  // Scene transitions
  const scene1End = 90;
  const scene2End = 180;
  const scene3End = 300;
  
  const currentScene = frame < scene1End ? 1 : frame < scene2End ? 2 : 3;

  const renderScene1 = () => (
    <div
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <BackgroundGradient 
        colors={['#1e293b', '#312e81', '#1e1b4b']}
        duration={60}
      />
      
      <TextAnimation
        animationType="fadeIn"
        delay={15}
        duration={45}
        style={{ zIndex: 10 }}
      >
        <h1
          style={{
            color: '#ffffff',
            fontSize: width / 6,
            fontWeight: 'bold',
            textAlign: 'center',
            margin: 0,
            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          Video Editor
        </h1>
      </TextAnimation>
      
      <TextAnimation
        animationType="slideUp"
        delay={30}
        duration={45}
        style={{ zIndex: 10, marginTop: width / 20 }}
      >
        <p
          style={{
            color: '#e2e8f0',
            fontSize: width / 16,
            textAlign: 'center',
            margin: 0,
            maxWidth: width * 0.8,
          }}
        >
          Powered by Remotion
        </p>
      </TextAnimation>
    </div>
  );

  const renderScene2 = () => (
    <div
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: '#0f172a',
      }}
    >
      <BackgroundGradient 
        colors={['#0f172a', '#1e293b', '#334155']}
        duration={45}
        direction="vertical"
      />
      
      <TextAnimation
        animationType="scaleIn"
        delay={0}
        duration={30}
        style={{ zIndex: 10 }}
      >
        <h2
          style={{
            color: '#ffffff',
            fontSize: width / 8,
            fontWeight: 'bold',
            textAlign: 'center',
            margin: 0,
          }}
        >
          Features
        </h2>
      </TextAnimation>
      
      <div style={{ marginTop: height / 8, zIndex: 10 }}>
        <AudioVisualizer
          barCount={24}
          barWidth={6}
          barSpacing={3}
          maxHeight={80}
          color="#3b82f6"
        />
      </div>
      
      <TextAnimation
        animationType="fadeIn"
        delay={20}
        duration={30}
        style={{ zIndex: 10, marginTop: height / 12 }}
      >
        <p
          style={{
            color: '#94a3b8',
            fontSize: width / 20,
            textAlign: 'center',
            margin: 0,
          }}
        >
          Advanced Video Creation
        </p>
      </TextAnimation>
    </div>
  );

  const renderScene3 = () => (
    <div
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: '#0f172a',
      }}
    >
      <BackgroundGradient 
        colors={['#1e1b4b', '#312e81', '#1e293b']}
        duration={40}
        direction="diagonal"
      />
      
      <Transition
        type="zoomIn"
        duration={30}
        style={{ zIndex: 10 }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2
            style={{
              color: '#ffffff',
              fontSize: width / 6,
              fontWeight: 'bold',
              margin: 0,
              marginBottom: height / 20,
            }}
          >
            Create Amazing Videos
          </h2>
          
          <div style={{ marginBottom: height / 15 }}>
            <AudioVisualizer
              barCount={32}
              barWidth={4}
              barSpacing={2}
              maxHeight={60}
              color="#10b981"
            />
          </div>
          
          <p
            style={{
              color: '#e2e8f0',
              fontSize: width / 18,
              margin: 0,
            }}
          >
            Frame: {frame - scene2End} | {width}x{height}
          </p>
        </div>
      </Transition>
    </div>
  );

  return (
    <div style={{ flex: 1, backgroundColor: '#0f172a' }}>
      {currentScene === 1 && renderScene1()}
      {currentScene === 2 && renderScene2()}
      {currentScene === 3 && renderScene3()}
    </div>
  );
};