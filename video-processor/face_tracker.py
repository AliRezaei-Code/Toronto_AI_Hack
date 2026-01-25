"""
Face Tracker Service - Extracts face coordinates from video using MediaPipe.

This module provides real-time face detection and tracking with:
- MediaPipe Face Detection for speed
- Kalman filtering for smooth coordinate transitions
- Multi-face tracking (up to 2 speakers)
- Normalized coordinate output for Remotion SmartCrop component
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import List, Optional, Dict, Tuple
from dataclasses import dataclass
from pathlib import Path
import json
import logging
from filterpy.kalman import KalmanFilter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class FaceDetection:
    """Single face detection result"""

    face_id: int
    x: float  # Normalized 0-1
    y: float  # Normalized 0-1
    width: float  # Normalized 0-1
    height: float  # Normalized 0-1
    confidence: float


@dataclass
class FaceCoordinate:
    """Face coordinate for a single frame"""

    frame: int
    timestamp: float
    face_id: int
    x: float
    y: float
    width: float
    height: float
    confidence: float

    def to_dict(self) -> dict:
        return {
            "frame": self.frame,
            "timestamp": self.timestamp,
            "face_id": self.face_id,
            "x": self.x,
            "y": self.y,
            "width": self.width,
            "height": self.height,
            "confidence": self.confidence,
        }


class FaceKalmanFilter:
    """Kalman filter for smoothing face tracking coordinates"""

    def __init__(self):
        # State: [x, y, width, height, dx, dy, dw, dh]
        self.kf = KalmanFilter(dim_x=8, dim_z=4)

        # State transition matrix
        dt = 1.0  # Time step (1 frame)
        self.kf.F = np.array(
            [
                [1, 0, 0, 0, dt, 0, 0, 0],
                [0, 1, 0, 0, 0, dt, 0, 0],
                [0, 0, 1, 0, 0, 0, dt, 0],
                [0, 0, 0, 1, 0, 0, 0, dt],
                [0, 0, 0, 0, 1, 0, 0, 0],
                [0, 0, 0, 0, 0, 1, 0, 0],
                [0, 0, 0, 0, 0, 0, 1, 0],
                [0, 0, 0, 0, 0, 0, 0, 1],
            ]
        )

        # Measurement function (only observe x, y, w, h)
        self.kf.H = np.array(
            [
                [1, 0, 0, 0, 0, 0, 0, 0],
                [0, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 1, 0, 0, 0, 0, 0],
                [0, 0, 0, 1, 0, 0, 0, 0],
            ]
        )

        # Measurement noise
        self.kf.R *= 0.01

        # Process noise
        self.kf.Q = np.eye(8) * 0.001

        # Initial covariance
        self.kf.P *= 100

        self.initialized = False

    def update(
        self, x: float, y: float, w: float, h: float
    ) -> Tuple[float, float, float, float]:
        """Update filter with new measurement and return smoothed values"""
        z = np.array([[x], [y], [w], [h]])

        if not self.initialized:
            self.kf.x[:4] = z
            self.initialized = True
            return x, y, w, h

        self.kf.predict()
        self.kf.update(z)

        return (
            float(self.kf.x[0, 0]),
            float(self.kf.x[1, 0]),
            float(self.kf.x[2, 0]),
            float(self.kf.x[3, 0]),
        )

    def predict(self) -> Tuple[float, float, float, float]:
        """Predict next position without measurement (for missing detections)"""
        if not self.initialized:
            return 0.5, 0.5, 0.2, 0.2  # Center default

        self.kf.predict()
        return (
            float(self.kf.x[0, 0]),
            float(self.kf.x[1, 0]),
            float(self.kf.x[2, 0]),
            float(self.kf.x[3, 0]),
        )


class FaceTracker:
    """Face tracking service using MediaPipe"""

    def __init__(
        self,
        min_detection_confidence: float = 0.5,
        max_faces: int = 2,
        enable_smoothing: bool = True,
    ):
        self.min_detection_confidence = min_detection_confidence
        self.max_faces = max_faces
        self.enable_smoothing = enable_smoothing

        # Initialize MediaPipe Face Detection
        self.mp_face_detection = mp.solutions.face_detection
        self.face_detection = self.mp_face_detection.FaceDetection(
            model_selection=1,  # 0 for short-range, 1 for full-range
            min_detection_confidence=min_detection_confidence,
        )

        # Kalman filters for each tracked face
        self.kalman_filters: Dict[int, FaceKalmanFilter] = {}

        # Face tracking state
        self.last_faces: List[FaceDetection] = []
        self.face_id_counter = 0

    def _assign_face_ids(self, detections: List[FaceDetection]) -> List[FaceDetection]:
        """Assign consistent face IDs across frames using IoU matching"""
        if not self.last_faces:
            # First frame - assign new IDs
            for i, det in enumerate(detections):
                det.face_id = i
            self.last_faces = detections
            return detections

        # Calculate IoU between current and previous detections
        def iou(a: FaceDetection, b: FaceDetection) -> float:
            x1 = max(a.x, b.x)
            y1 = max(a.y, b.y)
            x2 = min(a.x + a.width, b.x + b.width)
            y2 = min(a.y + a.height, b.y + b.height)

            if x2 <= x1 or y2 <= y1:
                return 0.0

            intersection = (x2 - x1) * (y2 - y1)
            area_a = a.width * a.height
            area_b = b.width * b.height

            return intersection / (area_a + area_b - intersection + 1e-6)

        # Greedy matching based on IoU
        used_prev = set()
        for det in detections:
            best_iou = 0.3  # Minimum IoU threshold
            best_id = -1

            for prev in self.last_faces:
                if prev.face_id in used_prev:
                    continue
                curr_iou = iou(det, prev)
                if curr_iou > best_iou:
                    best_iou = curr_iou
                    best_id = prev.face_id

            if best_id >= 0:
                det.face_id = best_id
                used_prev.add(best_id)
            else:
                det.face_id = self.face_id_counter
                self.face_id_counter += 1

        self.last_faces = detections
        return detections

    def _detect_faces(self, frame: np.ndarray) -> List[FaceDetection]:
        """Detect faces in a single frame"""
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        height, width = frame.shape[:2]

        results = self.face_detection.process(rgb_frame)

        detections = []
        if results.detections:
            for detection in results.detections[: self.max_faces]:
                bbox = detection.location_data.relative_bounding_box

                # MediaPipe returns normalized coordinates
                x = max(0, bbox.xmin)
                y = max(0, bbox.ymin)
                w = min(1 - x, bbox.width)
                h = min(1 - y, bbox.height)

                detections.append(
                    FaceDetection(
                        face_id=-1,  # Will be assigned
                        x=x,
                        y=y,
                        width=w,
                        height=h,
                        confidence=detection.score[0] if detection.score else 1.0,
                    )
                )

        return self._assign_face_ids(detections)

    def _smooth_coordinates(
        self, face_id: int, x: float, y: float, w: float, h: float
    ) -> Tuple[float, float, float, float]:
        """Apply Kalman smoothing to face coordinates"""
        if not self.enable_smoothing:
            return x, y, w, h

        if face_id not in self.kalman_filters:
            self.kalman_filters[face_id] = FaceKalmanFilter()

        return self.kalman_filters[face_id].update(x, y, w, h)

    def process_video(
        self,
        video_path: str,
        output_path: Optional[str] = None,
        progress_callback: Optional[callable] = None,
    ) -> Dict:
        """
        Process entire video and extract face coordinates.

        Returns dict with:
        - job_id: str
        - video_path: str
        - fps: float
        - total_frames: int
        - width: int
        - height: int
        - coordinates: List[FaceCoordinate]
        - smoothed: bool
        """
        cap = cv2.VideoCapture(video_path)

        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        logger.info(
            f"Processing video: {total_frames} frames at {fps} FPS ({width}x{height})"
        )

        coordinates: List[FaceCoordinate] = []
        frame_num = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            timestamp = frame_num / fps

            # Detect faces
            detections = self._detect_faces(frame)

            # Handle detected faces
            for det in detections:
                x, y, w, h = self._smooth_coordinates(
                    det.face_id, det.x, det.y, det.width, det.height
                )

                coordinates.append(
                    FaceCoordinate(
                        frame=frame_num,
                        timestamp=timestamp,
                        face_id=det.face_id,
                        x=x,
                        y=y,
                        width=w,
                        height=h,
                        confidence=det.confidence,
                    )
                )

            # Handle missing faces (predict from Kalman)
            detected_ids = {det.face_id for det in detections}
            for face_id, kf in self.kalman_filters.items():
                if face_id not in detected_ids and kf.initialized:
                    x, y, w, h = kf.predict()
                    coordinates.append(
                        FaceCoordinate(
                            frame=frame_num,
                            timestamp=timestamp,
                            face_id=face_id,
                            x=x,
                            y=y,
                            width=w,
                            height=h,
                            confidence=0.5,  # Lower confidence for predictions
                        )
                    )

            frame_num += 1

            if progress_callback and frame_num % 100 == 0:
                progress = (frame_num / total_frames) * 100
                progress_callback(progress)

        cap.release()

        result = {
            "job_id": "",  # To be filled by caller
            "video_path": str(video_path),
            "fps": fps,
            "total_frames": total_frames,
            "width": width,
            "height": height,
            "coordinates": [c.to_dict() for c in coordinates],
            "smoothed": self.enable_smoothing,
        }

        if output_path:
            with open(output_path, "w") as f:
                json.dump(result, f, indent=2)
            logger.info(f"Saved face tracking data to {output_path}")

        return result

    def close(self):
        """Clean up resources"""
        self.face_detection.close()


def process_video_cli():
    """CLI entry point for face tracking"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Extract face tracking data from video"
    )
    parser.add_argument("video_path", help="Path to input video")
    parser.add_argument("-o", "--output", help="Output JSON path", default=None)
    parser.add_argument(
        "--no-smoothing", action="store_true", help="Disable Kalman smoothing"
    )
    parser.add_argument(
        "--max-faces", type=int, default=2, help="Maximum faces to track"
    )
    parser.add_argument(
        "--confidence", type=float, default=0.5, help="Detection confidence threshold"
    )

    args = parser.parse_args()

    output_path = args.output
    if output_path is None:
        video_stem = Path(args.video_path).stem
        output_path = f"{video_stem}_face_tracking.json"

    tracker = FaceTracker(
        min_detection_confidence=args.confidence,
        max_faces=args.max_faces,
        enable_smoothing=not args.no_smoothing,
    )

    def progress(pct):
        print(f"\rProcessing: {pct:.1f}%", end="", flush=True)

    result = tracker.process_video(
        args.video_path,
        output_path=output_path,
        progress_callback=progress,
    )

    print(f"\nProcessed {result['total_frames']} frames")
    print(f"Found {len(set(c['face_id'] for c in result['coordinates']))} unique faces")
    print(f"Output saved to: {output_path}")

    tracker.close()


if __name__ == "__main__":
    process_video_cli()
