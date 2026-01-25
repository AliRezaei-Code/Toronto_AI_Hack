# Remotion Use Cases Playbook

## Use Cases
- **Script-driven edit sessions**: The home layout in `frontend/app/page.tsx` wires together uploads, transcript editing, and the `MagicBox` chat UI so creators can upload clips, watch progress, and send prompts without leaving one page. Extend the same flow when experimenting with new prompts documented in [Getting Started](./remotion-getting-started.md).
- **Component-based composition trials**: Follow the composition setup steps in `docs/remotion-getting-started.md` to register new scenes from `frontend/components` helpers such as `VideoPreview.tsx` and `WaveformTimeline.tsx`, then match the timing described in `VideoComposition.tsx` for repeatable narrative beats.
- **Programmatic renders and thumbnails**: Trigger server-side exports from the `POST /api/render` and `POST /api/thumbnail` flows outlined in `docs/remotion-api-endpoints.md`, so you can convert interactive previews into production MP4s or stills once the front-end job flow reaches the final `processEdit` step.

## Advanced Features
- **Component library reference**: Deep dive into `docs/remotion-components-api.md` to see how `TextAnimation`, `BackgroundGradient`, `AudioVisualizer`, and `Transition` behave so you can layer them in new `AbsoluteFill` scenes or reuse them inside `frontend/components/MagicBox.tsx` replies.
- **Responsive timing and props**: Use the recommended frame-based hooks (`useCurrentFrame`, `useVideoConfig`) shown across the docs to create responsive overlays; reuse the custom hooks and spring tuning examples from `docs/remotion-getting-started.md` when adding data-driven elements that adapt to props passed from the editor.
- **Live data playback**: Pair the asynchronous fetches in `frontend/lib/api-client.ts` with the UI states from `frontend/app/page.tsx` so Remotion compositions can react to real user transcripts and keep the waveform/player in sync while editing.

## Troubleshooting
- **Dev server or preview stalls**: If the Remotion preview does not refresh, double-check the `npm run dev` / `npm run remotion:preview` steps in `docs/remotion-getting-started.md`, then inspect the `handleUpload` and `pollJobStatus` logic in `frontend/app/page.tsx` for unexpected error handling or stale intervals.
- **Render or thumbnail failures**: Use the error scenarios described in `docs/remotion-api-endpoints.md` and confirm that `frontend/lib/api-client.ts` is sending the correct `compositionId`, `inputProps`, and `frame` before the backend even bundles Remotion; this helps isolate whether the issue is client input validation or server bundling.
- **Component glitches**: When an animation never reaches the desired frame, review the component defaults listed in `docs/remotion-components-api.md` and ensure the same props are passed through `VideoComposition.tsx` (IDs `VideoEditor`/`ShortForm`) referenced in the API docs, so the server-rendered and preview versions stay aligned.

## Integration Tips
- **Reuse API helpers**: Keep using the `uploadVideos`, `getJobStatus`, and `processEdit` helpers in `frontend/lib/api-client.ts`; their payload structure already matches what `docs/remotion-api-endpoints.md` expects, so you can plug in server-rendered compositions or thumbnail jobs without rewiring the front-end.
- **Component handshake**: Expose the core Remotion components through the shared `frontend/components` directory whenever `MagicBox` replies or `TranscriptEditor` updates need to show an animated preview—this keeps the `docs/remotion-components-api.md` examples close to the actual UI pieces users interact with.
- **Monitoring UX state**: Mirror the status message patterns in `frontend/app/page.tsx` (error/warning/success alerts) in any new Remotion UI you build so the troubleshooting stories from the docs and API responses stay obvious to designers and engineers alike.

## Additional Resources
- [Getting Started Guide](./remotion-getting-started.md)
- [Component API Reference](./remotion-components-api.md)
- [Server Rendering Endpoints](./remotion-api-endpoints.md)
- [`frontend/components/` directory](../frontend/components/)
- [`frontend/lib/api-client.ts`](../frontend/lib/api-client.ts)
